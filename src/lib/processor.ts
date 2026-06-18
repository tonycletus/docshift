import { PDFDocument, degrees, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import type { Tool } from "./tools";
import { createDocxFromPages, createPptxFromImages, createXlsxFromRows } from "./office";

export type ProcessResult = {
  blob: Blob;
  filename: string;
  meta?: {
    compression?: {
      status: "compressed" | "already-optimized";
      originalSize: number;
      outputSize: number;
      message: string;
    };
  };
};

type ProcessOptions = Record<string, string | File | undefined>;

type PageRange = {
  label: string;
  indices: number[];
};

function optionText(options: ProcessOptions, key: string, fallback = ""): string {
  const value = options[key];
  return typeof value === "string" ? value : fallback;
}

function parseRanges(input: string, max: number): number[] {
  return parseRangeGroups(input, max).flatMap((range) => range.indices);
}

function parseRangeGroups(input: string, max: number): PageRange[] {
  const parts = input.split(/[,\s]+/).filter(Boolean);
  const ranges: PageRange[] = [];

  for (const part of parts) {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`"${part}" is not a valid page range.`);

    const start = Math.max(1, parseInt(match[1], 10));
    const rawEnd = match[2] ? parseInt(match[2], 10) : start;
    const end = Math.min(Math.max(start, rawEnd), max);
    if (start > max) continue;

    const indices = Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
    ranges.push({ label: start === end ? `${start}` : `${start}-${end}`, indices });
  }

  return ranges;
}

async function readBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

function baseName(file: File): string {
  return file.name.replace(/\.[^.]+$/i, "") || "document";
}

function dedupe(indices: number[]): number[] {
  return [...new Set(indices)];
}

async function copyPagesToPdf(src: PDFDocument, indices: number[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((page) => out.addPage(page));
  return out.save();
}

async function rebuildPdfLosslessly(file: File): Promise<Uint8Array> {
  const src = await PDFDocument.load(await readBytes(file), {
    ignoreEncryption: false,
    updateMetadata: false,
  });
  return src.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });
}

async function buildPdfFromRasterizedPages(
  pages: Array<{ blob: Blob; width: number; height: number }>,
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const rasterized of pages) {
    const img = await out.embedJpg(new Uint8Array(await rasterized.blob.arrayBuffer()));
    const page = out.addPage([rasterized.width, rasterized.height]);
    page.drawImage(img, { x: 0, y: 0, width: rasterized.width, height: rasterized.height });
  }
  return out.save({ useObjectStreams: true, addDefaultPage: false });
}

function compressionResult(file: File, bytes: Uint8Array, message: string): ProcessResult {
  const originalSize = file.size;
  const outputSize = bytes.byteLength;
  const status = outputSize < originalSize ? "compressed" : "already-optimized";
  return {
    blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
    filename: `${baseName(file)}-compressed.pdf`,
    meta: {
      compression: {
        status,
        originalSize,
        outputSize,
        message,
      },
    },
  };
}

function smallerThanOriginal(
  bytes: Uint8Array,
  originalSize: number,
  minSavingsPercent: number,
): boolean {
  return bytes.byteLength < originalSize * (1 - minSavingsPercent / 100);
}

function textBlob(text: string): Blob {
  return new Blob([text], { type: "text/plain;charset=utf-8" });
}

function groupPositionedText(
  rows: Array<{ text: string; x: number; y: number; pageNumber: number }>,
): string[][] {
  const output: string[][] = [
    ["Page", "Column 1", "Column 2", "Column 3", "Column 4", "Column 5", "Column 6"],
  ];
  const byPage = new Map<number, typeof rows>();

  rows.forEach((row) => {
    byPage.set(row.pageNumber, [...(byPage.get(row.pageNumber) ?? []), row]);
  });

  for (const [pageNumber, pageRows] of [...byPage.entries()].sort((a, b) => a[0] - b[0])) {
    const lines = new Map<number, typeof rows>();
    pageRows.forEach((item) => {
      const y = Math.round(item.y / 4) * 4;
      lines.set(y, [...(lines.get(y) ?? []), item]);
    });

    [...lines.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, lineItems]) => {
        const columns = lineItems.sort((a, b) => a.x - b.x).map((item) => item.text);
        output.push([String(pageNumber), ...columns]);
      });
  }

  return output;
}

function wrapText(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

async function createPdfFromText(lines: string[], filename: string): Promise<ProcessResult> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 54;
  const size = 11;
  const lineHeight = 16;
  let page = pdf.addPage([595.28, 841.89]);
  let y = page.getHeight() - margin;

  page.drawText(filename, { x: margin, y, size: 16, font: bold, color: rgb(0.1, 0.1, 0.1) });
  y -= 30;

  const drawLine = (line: string) => {
    if (y < margin) {
      page = pdf.addPage([595.28, 841.89]);
      y = page.getHeight() - margin;
    }
    page.drawText(line, { x: margin, y, size, font, color: rgb(0.12, 0.12, 0.12) });
    y -= lineHeight;
  };

  lines.forEach((line) => {
    wrapText(line, font, size, page.getWidth() - margin * 2).forEach(drawLine);
    if (!line.trim()) y -= lineHeight / 2;
  });

  const bytes = await pdf.save();
  return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename };
}

async function embedWatermarkImage(pdf: PDFDocument, file: File) {
  const bytes = await readBytes(file);
  if (file.type === "image/png" || file.name.toLowerCase().endsWith(".png")) {
    return pdf.embedPng(bytes);
  }
  if (
    file.type === "image/jpeg" ||
    file.name.toLowerCase().endsWith(".jpg") ||
    file.name.toLowerCase().endsWith(".jpeg")
  ) {
    return pdf.embedJpg(bytes);
  }
  throw new Error("Upload a JPG or PNG watermark image.");
}

async function extractDocxLines(file: File): Promise<string[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) throw new Error("Upload a valid .docx file.");

  const xml = new DOMParser().parseFromString(documentXml, "application/xml");
  const paragraphs = [...xml.getElementsByTagName("w:p")];
  const lines = paragraphs.map((paragraph) =>
    [...paragraph.getElementsByTagName("w:t")].map((node) => node.textContent ?? "").join(""),
  );

  return lines.filter((line, index) => line.trim() || index === 0);
}

export async function processTool(
  tool: Tool,
  files: File[],
  options: ProcessOptions,
  onProgress?: (pct: number) => void,
): Promise<ProcessResult> {
  onProgress?.(10);

  switch (tool.slug) {
    case "merge": {
      const out = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const src = await PDFDocument.load(await readBytes(files[i]));
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((page) => out.addPage(page));
        onProgress?.(20 + Math.round(((i + 1) / files.length) * 70));
      }
      const bytes = await out.save();
      onProgress?.(100);
      return {
        blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        filename: "merged.pdf",
      };
    }

    case "split": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const total = src.getPageCount();
      const rangeText = optionText(options, "ranges");
      const ranges = rangeText.trim()
        ? parseRangeGroups(rangeText, total)
        : Array.from({ length: total }, (_, i) => ({ label: `${i + 1}`, indices: [i] }));
      if (!ranges.length) throw new Error("Choose at least one page range.");

      const zip = new JSZip();
      for (let i = 0; i < ranges.length; i++) {
        const bytes = await copyPagesToPdf(src, ranges[i].indices);
        zip.file(`${baseName(files[0])}-pages-${ranges[i].label}.pdf`, bytes);
        onProgress?.(20 + Math.round(((i + 1) / ranges.length) * 60));
      }
      const blob = await zip.generateAsync({ type: "blob" }, (meta) => {
        onProgress?.(80 + Math.round(meta.percent * 0.2));
      });
      onProgress?.(100);
      return { blob, filename: `${baseName(files[0])}-split.zip` };
    }

    case "compress": {
      const { rasterizePdf, COMPRESSION_PRESETS } = await import("./pdfjs");
      const level = (optionText(options, "level") as keyof typeof COMPRESSION_PRESETS) || "medium";
      const originalBytes = await readBytes(files[0]);
      const candidates: Array<{ bytes: Uint8Array; message: string; lossy: boolean }> = [
        {
          bytes: originalBytes,
          message:
            "No quality-safe reduction was found, so the original PDF was preserved exactly.",
          lossy: false,
        },
      ];

      onProgress?.(18);
      try {
        const lossless = await rebuildPdfLosslessly(files[0]);
        candidates.push({
          bytes: lossless,
          message: "Optimized the PDF structure without rasterizing pages or lowering quality.",
          lossy: false,
        });
      } catch {
        candidates.push({
          bytes: originalBytes,
          message:
            "No quality-safe reduction was found, so the original PDF was preserved exactly.",
          lossy: false,
        });
      }

      const bestLossless = candidates.reduce((best, candidate) =>
        candidate.bytes.byteLength < best.bytes.byteLength ? candidate : best,
      );

      const losslessSavedPercent = Math.round(
        ((files[0].size - bestLossless.bytes.byteLength) / files[0].size) * 100,
      );
      const shouldTryRaster = level === "high" || (level === "medium" && losslessSavedPercent < 12);
      let rasterWasTested = false;

      if (shouldTryRaster) {
        rasterWasTested = true;
        const preset = COMPRESSION_PRESETS[level] ?? COMPRESSION_PRESETS.medium;
        const pages = await rasterizePdf(files[0], {
          ...preset,
          onProgress: (cur, total) => onProgress?.(20 + Math.round((cur / total) * 65)),
        });
        const rasterBytes = await buildPdfFromRasterizedPages(pages);
        const minSavings = level === "high" ? 1 : 8;
        if (smallerThanOriginal(rasterBytes, files[0].size, minSavings)) {
          candidates.push({
            bytes: rasterBytes,
            message:
              level === "high"
                ? "Used stronger image compression to produce the smallest quality-checked result."
                : "Used smart image compression because it produced a meaningful size reduction.",
            lossy: true,
          });
        }
      }

      const best =
        level === "high"
          ? candidates.reduce((currentBest, candidate) =>
              candidate.bytes.byteLength < currentBest.bytes.byteLength ? candidate : currentBest,
            )
          : candidates.reduce((currentBest, candidate) => {
              if (candidate.lossy && bestLossless.bytes.byteLength <= candidate.bytes.byteLength) {
                return currentBest;
              }
              return candidate.bytes.byteLength < currentBest.bytes.byteLength
                ? candidate
                : currentBest;
            }, candidates[0]);
      const output = best.bytes.byteLength <= files[0].size ? best : candidates[0];
      const message =
        output.lossy || level === "low"
          ? output.message
          : level === "medium"
            ? rasterWasTested
              ? "Balanced tested image compression, but kept the sharper lossless PDF because it was the better result."
              : "Balanced kept the lossless result because it already reduced size without lowering quality."
            : rasterWasTested
              ? "Smaller tested stronger image compression, but the lossless PDF was still the smallest quality-safe result."
              : "Smaller kept the lossless result because it was already the smallest safe output.";
      onProgress?.(100);
      return compressionResult(files[0], output.bytes, message);
    }

    case "pdf-to-word": {
      const { extractPdfTextPages } = await import("./pdfjs");
      const pages = await extractPdfTextPages(files[0], (cur, total) =>
        onProgress?.(10 + Math.round((cur / total) * 70)),
      );
      const blob = await createDocxFromPages(pages, baseName(files[0]));
      onProgress?.(100);
      return { blob, filename: `${baseName(files[0])}.docx` };
    }

    case "pdf-to-excel": {
      const { extractPositionedText } = await import("./pdfjs");
      const rows = await extractPositionedText(files[0], (cur, total) =>
        onProgress?.(10 + Math.round((cur / total) * 70)),
      );
      const blob = await createXlsxFromRows(groupPositionedText(rows), baseName(files[0]));
      onProgress?.(100);
      return { blob, filename: `${baseName(files[0])}.xlsx` };
    }

    case "pdf-to-powerpoint": {
      const { rasterizePdf } = await import("./pdfjs");
      const pages = await rasterizePdf(files[0], {
        scale: 2.0,
        quality: 0.94,
        onProgress: (cur, total) => onProgress?.(10 + Math.round((cur / total) * 65)),
      });
      const blob = await createPptxFromImages(
        pages.map((page) => page.blob),
        baseName(files[0]),
      );
      onProgress?.(100);
      return { blob, filename: `${baseName(files[0])}.pptx` };
    }

    case "pdf-to-jpg": {
      const { rasterizePdf } = await import("./pdfjs");
      const pages = await rasterizePdf(files[0], {
        scale: 2.4,
        quality: 0.94,
        onProgress: (cur, total) => onProgress?.(10 + Math.round((cur / total) * 70)),
      });
      const zip = new JSZip();
      const pad = String(pages.length).length;
      pages.forEach((page, i) => {
        zip.file(`${baseName(files[0])}-page-${String(i + 1).padStart(pad, "0")}.jpg`, page.blob);
      });
      const blob = await zip.generateAsync({ type: "blob" }, (meta) => {
        onProgress?.(80 + Math.round(meta.percent * 0.2));
      });
      onProgress?.(100);
      return { blob, filename: `${baseName(files[0])}-images.zip` };
    }

    case "jpg-to-pdf": {
      const out = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const bytes = await readBytes(file);
        const img =
          file.type === "image/png" ? await out.embedPng(bytes) : await out.embedJpg(bytes);
        const page = out.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        onProgress?.(20 + Math.round(((i + 1) / files.length) * 70));
      }
      const bytes = await out.save();
      onProgress?.(100);
      return {
        blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        filename: "images.pdf",
      };
    }

    case "word-to-pdf": {
      const lines = await extractDocxLines(files[0]);
      onProgress?.(70);
      const result = await createPdfFromText(lines, `${baseName(files[0])}.pdf`);
      onProgress?.(100);
      return result;
    }

    case "ocr": {
      const { extractPdfTextPages } = await import("./pdfjs");
      const pages = await extractPdfTextPages(files[0], (cur, total) =>
        onProgress?.(10 + Math.round((cur / total) * 80)),
      );
      const text = pages
        .map((page) => [`Page ${page.pageNumber}`, ...page.lines].join("\n"))
        .join("\n\n")
        .trim();
      if (!text) throw new Error("No selectable text was found in this PDF.");
      onProgress?.(100);
      return { blob: textBlob(text), filename: `${baseName(files[0])}.txt` };
    }

    case "protect": {
      const { encryptPdfWithPassword } = await import("./qpdf");
      const blob = await encryptPdfWithPassword(files[0], optionText(options, "password"));
      onProgress?.(100);
      return { blob, filename: `${baseName(files[0])}-protected.pdf` };
    }

    case "unlock": {
      const { unlockPasswordPdf } = await import("./qpdf");
      const blob = await unlockPasswordPdf(files[0], optionText(options, "password"));
      onProgress?.(100);
      return { blob, filename: `${baseName(files[0])}-unlocked.pdf` };
    }

    case "watermark": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const watermarkImage =
        options.watermarkImage instanceof File
          ? await embedWatermarkImage(src, options.watermarkImage)
          : null;
      const font = watermarkImage ? null : await src.embedFont(StandardFonts.HelveticaBold);
      const text = optionText(options, "text").trim() || "CONFIDENTIAL";
      src.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        if (watermarkImage) {
          const maxWidth = width * 0.55;
          const maxHeight = height * 0.28;
          const scale = Math.min(
            maxWidth / watermarkImage.width,
            maxHeight / watermarkImage.height,
            1,
          );
          const imageWidth = watermarkImage.width * scale;
          const imageHeight = watermarkImage.height * scale;
          page.drawImage(watermarkImage, {
            x: width / 2 - imageWidth / 2,
            y: height / 2 - imageHeight / 2,
            width: imageWidth,
            height: imageHeight,
            opacity: 0.22,
            rotate: degrees(45),
          });
          return;
        }

        const size = Math.min(width, height) * 0.12;
        page.drawText(text, {
          x: width / 2 - (text.length * size) / 4,
          y: height / 2,
          size,
          font: font!,
          color: rgb(0.7, 0.7, 0.75),
          opacity: 0.25,
          rotate: degrees(45),
        });
      });
      const bytes = await src.save();
      onProgress?.(100);
      return {
        blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        filename: "watermarked.pdf",
      };
    }

    case "page-numbers": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const font = await src.embedFont(StandardFonts.Helvetica);
      const pos = optionText(options, "position", "bottom-center");
      const pages = src.getPages();
      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const label = `${i + 1} / ${pages.length}`;
        const size = 10;
        const tw = font.widthOfTextAtSize(label, size);
        let x = width / 2 - tw / 2;
        let y = 24;
        if (pos === "bottom-right") {
          x = width - tw - 24;
          y = 24;
        }
        if (pos === "top-right") {
          x = width - tw - 24;
          y = height - 24;
        }
        page.drawText(label, { x, y, size, font, color: rgb(0.3, 0.3, 0.35) });
      });
      const bytes = await src.save();
      onProgress?.(100);
      return {
        blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        filename: "numbered.pdf",
      };
    }

    case "extract-pages": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const indices = dedupe(parseRanges(optionText(options, "ranges"), src.getPageCount()));
      if (!indices.length) throw new Error("Specify at least one page range.");
      const bytes = await copyPagesToPdf(src, indices);
      onProgress?.(100);
      return {
        blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        filename: "extracted.pdf",
      };
    }

    case "delete-pages": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const total = src.getPageCount();
      const remove = new Set(parseRanges(optionText(options, "ranges"), total));
      if (!remove.size) throw new Error("Specify at least one page to delete.");
      const keep = Array.from({ length: total }, (_, i) => i).filter((i) => !remove.has(i));
      if (!keep.length) throw new Error("A PDF must keep at least one page.");
      const bytes = await copyPagesToPdf(src, keep);
      onProgress?.(100);
      return {
        blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        filename: "trimmed.pdf",
      };
    }

    case "rotate": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const angle = parseInt(optionText(options, "angle", "90"), 10);
      src.getPages().forEach((page) => {
        const currentAngle = page.getRotation().angle;
        page.setRotation(degrees((currentAngle + angle) % 360));
      });
      const bytes = await src.save();
      onProgress?.(100);
      return {
        blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        filename: "rotated.pdf",
      };
    }

    case "reorder": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const total = src.getPageCount();
      const order = optionText(options, "order")
        .split(/[,\s]+/)
        .filter(Boolean)
        .map((n) => parseInt(n, 10) - 1);
      if (!order.length) throw new Error("Specify a new page order.");
      if (order.some((n) => Number.isNaN(n) || n < 0 || n >= total)) {
        throw new Error(`Use page numbers between 1 and ${total}.`);
      }
      const bytes = await copyPagesToPdf(src, order);
      onProgress?.(100);
      return {
        blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        filename: "reordered.pdf",
      };
    }
  }

  throw new Error(`${tool.name} is not configured.`);
}
