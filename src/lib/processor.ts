import { PDFDocument, degrees, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import type { Tool } from "./tools";
import { createDocxFromPages, createPptxFromImages, createXlsxFromRows } from "./office";
import type { OcrTextPage, PositionedText, TextPage } from "./pdfjs";

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

type PreparedField = {
  pageNumber: number;
  type: "text" | "checkbox";
  name: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const FIELD_WORDS =
  /\b(name|first|last|email|e-mail|phone|mobile|telephone|address|city|state|zip|postal|country|date|signature|signed|company|organization|title|role|position|amount|invoice|reference|account|number|id|description|notes|comment|birth|dob|ssn|tax|license|policy|claim)\b/i;
const CHECKBOX_WORDS =
  /\b(yes|no|agree|accept|consent|approve|confirm|check|select|male|female|single|married)\b/i;

function formatOcrPages(pages: TextPage[]): string {
  return pages
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map((page) => [`Page ${page.pageNumber}`, ...page.lines].join("\n"))
    .join("\n\n")
    .trim();
}

function shouldOcrPage(page: TextPage): boolean {
  return page.lines.join(" ").replace(/\s+/g, "").length < 25;
}

function sanitizePdfText(text: string): string {
  return [...text]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127);
    })
    .join("")
    .trim();
}

async function createSearchableOcrPdf(file: File, recognizedPages: OcrTextPage[]) {
  const src = await PDFDocument.load(await readBytes(file), {
    ignoreEncryption: false,
    updateMetadata: false,
  });
  const font = await src.embedFont(StandardFonts.Helvetica);
  const pages = src.getPages();
  let wordsDrawn = 0;

  for (const recognizedPage of recognizedPages) {
    const page = pages[recognizedPage.pageNumber - 1];
    if (!page || !recognizedPage.words.length) continue;

    const { width, height } = page.getSize();
    const scaleX = width / recognizedPage.imageWidth;
    const scaleY = height / recognizedPage.imageHeight;

    for (const word of recognizedPage.words) {
      const text = sanitizePdfText(word.text);
      if (!text) continue;

      const boxWidth = Math.max(1, (word.bbox.x1 - word.bbox.x0) * scaleX);
      const boxHeight = Math.max(3, (word.bbox.y1 - word.bbox.y0) * scaleY);
      const x = clamp(word.bbox.x0 * scaleX, 0, width - 1);
      const y = clamp(height - word.bbox.y1 * scaleY, 0, height - 1);
      let size = clamp(boxHeight * 0.82, 3, 24);
      const measuredWidth = font.widthOfTextAtSize(text, size);

      if (measuredWidth > boxWidth && measuredWidth > 0) {
        size = clamp(size * (boxWidth / measuredWidth), 3, 24);
      }

      page.drawText(text, {
        x,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
        opacity: 0.01,
      });
      wordsDrawn += 1;
    }
  }

  if (!wordsDrawn) {
    throw new Error("OCR could not place a searchable text layer on this PDF.");
  }

  return src.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });
}

function detectFillableFields(rows: PositionedText[], mode: string): PreparedField[] {
  const maxFields = mode === "dense" ? 90 : 50;
  const grouped = new Map<string, PositionedText[]>();

  for (const row of rows) {
    const y = Math.round(row.y / 5) * 5;
    grouped.set(`${row.pageNumber}:${y}`, [...(grouped.get(`${row.pageNumber}:${y}`) ?? []), row]);
  }

  const fields: PreparedField[] = [];
  const seen = new Set<string>();

  for (const lineItems of [...grouped.values()].sort((a, b) => {
    const pageDiff = a[0].pageNumber - b[0].pageNumber;
    return pageDiff || b[0].y - a[0].y;
  })) {
    if (fields.length >= maxFields) break;
    const ordered = lineItems.sort((a, b) => a.x - b.x);
    const page = ordered[0];
    const text = ordered
      .map((item) => item.text)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    const normalized = text
      .replace(/[-_:.\s]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const hasBlankCue = /_{3,}|\.{4,}|-{4,}/.test(text);
    const hasColonCue = /:\s*$/.test(text) || /:\s*_{2,}/.test(text);
    const likelyLabel =
      FIELD_WORDS.test(normalized) &&
      (mode === "dense" || hasBlankCue || hasColonCue || normalized.split(/\s+/).length <= 5);
    const checkboxCue = /(?:\[\s*\]|☐|□|○)/.test(text) || CHECKBOX_WORDS.test(normalized);

    if (!likelyLabel && !hasBlankCue && !(mode === "dense" && checkboxCue)) continue;

    const lineStart = Math.min(...ordered.map((item) => item.x));
    const lineEnd = Math.max(
      ...ordered.map((item) => item.x + Math.max(item.width, item.text.length * 5)),
    );
    const pageWidth = page.pageWidth || 612;
    const pageHeight = page.pageHeight || 792;
    const key = `${page.pageNumber}:${Math.round(page.y)}:${normalized.toLowerCase().slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (checkboxCue && !hasBlankCue && !hasColonCue) {
      const x = Math.max(24, Math.min(lineStart - 20, pageWidth - 44));
      fields.push({
        pageNumber: page.pageNumber,
        type: "checkbox",
        name: fieldName(normalized || "checkbox", fields.length),
        label: normalized || "Checkbox",
        x,
        y: clamp(page.y - 2, 24, pageHeight - 36),
        width: 14,
        height: 14,
      });
      continue;
    }

    const naturalX = hasBlankCue ? Math.max(lineStart + 90, lineEnd - 170) : lineEnd + 12;
    const x = clamp(naturalX, 48, Math.max(60, pageWidth - 230));
    const available = Math.max(120, pageWidth - x - 48);
    const width = Math.min(hasBlankCue ? Math.max(140, lineEnd - x) : 190, available);

    fields.push({
      pageNumber: page.pageNumber,
      type: "text",
      name: fieldName(normalized || text || "field", fields.length),
      label: normalized || text || "Field",
      x,
      y: clamp(page.y - 7, 24, pageHeight - 34),
      width,
      height: 20,
    });
  }

  return fields;
}

function fieldName(label: string, index: number): string {
  const cleaned =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 42) || "field";
  return `${cleaned}_${index + 1}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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
      const { extractPdfTextPages, ocrPdfPages } = await import("./pdfjs");
      const output = optionText(options, "output", "searchable-pdf");
      const pages = await extractPdfTextPages(files[0], (cur, total) =>
        onProgress?.(10 + Math.round((cur / total) * 25)),
      );
      const pagesNeedingOcr = pages.filter(shouldOcrPage).map((page) => page.pageNumber);
      let finalPages: TextPage[] = pages;
      let recognizedPages: OcrTextPage[] = [];

      if (pagesNeedingOcr.length) {
        recognizedPages = await ocrPdfPages(files[0], pagesNeedingOcr, (done, total, pagePct) => {
          const pageProgress = total ? (done + pagePct) / total : 1;
          onProgress?.(35 + Math.round(pageProgress * 55));
        });
        const recognizedByPage = new Map(
          recognizedPages
            .filter((page) => page.lines.length)
            .map((page) => [page.pageNumber, page] as const),
        );
        finalPages = pages.map((page) => recognizedByPage.get(page.pageNumber) ?? page);
      }

      if (output === "text") {
        const text = formatOcrPages(finalPages);
        if (!text) throw new Error("No text was recognized in this PDF.");
        onProgress?.(100);
        return { blob: textBlob(text), filename: `${baseName(files[0])}.txt` };
      }

      if (!pagesNeedingOcr.length) {
        const bytes = await rebuildPdfLosslessly(files[0]);
        onProgress?.(100);
        return {
          blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
          filename: `${baseName(files[0])}-searchable.pdf`,
        };
      }

      const searchablePages = recognizedPages.filter((page) => page.words.length);
      if (!searchablePages.length) throw new Error("No text was recognized in this PDF.");
      const bytes = await createSearchableOcrPdf(files[0], searchablePages);
      onProgress?.(100);
      return {
        blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        filename: `${baseName(files[0])}-searchable.pdf`,
      };
    }

    case "prepare-form": {
      const { extractPositionedText } = await import("./pdfjs");
      const src = await PDFDocument.load(await readBytes(files[0]));
      const rows = await extractPositionedText(files[0], (cur, total) =>
        onProgress?.(10 + Math.round((cur / total) * 35)),
      );
      const fields = detectFillableFields(rows, optionText(options, "mode", "balanced"));
      if (!fields.length) {
        throw new Error(
          "No likely form labels were found. Try Dense detection on forms with short labels or faint blank lines.",
        );
      }

      const form = src.getForm();
      const font = await src.embedFont(StandardFonts.Helvetica);
      const pages = src.getPages();

      fields.forEach((field, index) => {
        const page = pages[field.pageNumber - 1];
        if (!page) return;
        const name = `${field.name}_${index}`;
        if (field.type === "checkbox") {
          const checkbox = form.createCheckBox(name);
          checkbox.addToPage(page, {
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            borderWidth: 1,
            borderColor: rgb(0.2, 0.33, 0.72),
            backgroundColor: rgb(1, 1, 1),
          });
          return;
        }

        const textField = form.createTextField(name);
        textField.setFontSize(10);
        textField.addToPage(page, {
          x: field.x,
          y: field.y,
          width: field.width,
          height: field.height,
          borderWidth: 1,
          borderColor: rgb(0.2, 0.33, 0.72),
          backgroundColor: rgb(0.96, 0.98, 1),
          textColor: rgb(0.08, 0.1, 0.15),
        });
      });

      form.updateFieldAppearances(font);
      const bytes = await src.save({ useObjectStreams: true, updateFieldAppearances: true });
      onProgress?.(100);
      return {
        blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
        filename: `${baseName(files[0])}-fillable.pdf`,
        meta: undefined,
      };
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
