import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Import this module only inside client event handlers. pdfjs-dist touches
// browser globals, and this bundled worker keeps production builds CDN-free.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface RasterizedPage {
  blob: Blob;
  width: number;
  height: number;
}

export interface RasterizeOptions {
  /** Render scale applied on top of the PDF's natural size at 72 DPI. */
  scale: number;
  /** JPEG quality, 0-1. */
  quality: number;
  onProgress?: (currentPage: number, totalPages: number) => void;
}

export interface TextPage {
  pageNumber: number;
  lines: string[];
}

export interface PositionedText {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth: number;
  pageHeight: number;
  pageNumber: number;
}

export interface OcrTextPage extends TextPage {
  confidence: number;
}

export async function rasterizePdf(
  file: File,
  { scale, quality, onProgress }: RasterizeOptions,
): Promise<RasterizedPage[]> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const out: RasterizedPage[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    onProgress?.(i, doc.numPages);
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable.");

    // White background because JPEG has no alpha channel.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to encode page."))),
        "image/jpeg",
        quality,
      ),
    );
    out.push({ blob, width: canvas.width, height: canvas.height });
    page.cleanup();
  }

  doc.cleanup();
  return out;
}

export async function extractPdfTextPages(
  file: File,
  onProgress?: (currentPage: number, totalPages: number) => void,
): Promise<TextPage[]> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const pages: TextPage[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    onProgress?.(i, doc.numPages);
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const lines = new Map<number, string[]>();

    for (const item of content.items as Array<{ str?: string; transform?: number[] }>) {
      const text = item.str?.trim();
      if (!text) continue;
      const y = Math.round(item.transform?.[5] ?? 0);
      lines.set(y, [...(lines.get(y) ?? []), text]);
    }

    pages.push({
      pageNumber: i,
      lines: [...lines.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([, parts]) => parts.join(" ").replace(/\s+/g, " ").trim())
        .filter(Boolean),
    });
    page.cleanup();
  }

  doc.cleanup();
  return pages;
}

export async function extractPositionedText(
  file: File,
  onProgress?: (currentPage: number, totalPages: number) => void,
): Promise<PositionedText[]> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const rows: PositionedText[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    onProgress?.(i, doc.numPages);
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();

    for (const item of content.items as Array<{
      str?: string;
      transform?: number[];
      width?: number;
      height?: number;
    }>) {
      const text = item.str?.trim();
      if (!text) continue;
      rows.push({
        text,
        x: item.transform?.[4] ?? 0,
        y: item.transform?.[5] ?? 0,
        width: item.width ?? 0,
        height: item.height ?? 10,
        pageWidth: viewport.width,
        pageHeight: viewport.height,
        pageNumber: i,
      });
    }
    page.cleanup();
  }

  doc.cleanup();
  return rows;
}

export async function ocrPdfPages(
  file: File,
  pageNumbers: number[],
  onProgress?: (completedPages: number, totalPages: number, activePageProgress: number) => void,
): Promise<OcrTextPage[]> {
  const uniquePageNumbers = [...new Set(pageNumbers)].sort((a, b) => a - b);
  if (!uniquePageNumbers.length) return [];

  const tesseractModule = await import("tesseract.js");
  const createWorker = tesseractModule.createWorker ?? tesseractModule.default?.createWorker;
  if (!createWorker) throw new Error("OCR engine could not be loaded.");

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const out: OcrTextPage[] = [];
  let completed = 0;

  const worker = await createWorker("eng", 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/tesseract-core-lstm.wasm.js",
    langPath: "/tesseract",
    cachePath: "docshift-ocr",
    workerBlobURL: false,
    gzip: true,
    logger: (message) => {
      if (message.status === "recognizing text") {
        onProgress?.(completed, uniquePageNumbers.length, message.progress);
      }
    },
  });

  try {
    await worker.setParameters({
      preserve_interword_spaces: "1",
      user_defined_dpi: "180",
    });

    for (const pageNumber of uniquePageNumbers) {
      if (pageNumber < 1 || pageNumber > doc.numPages) continue;
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2.2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Canvas 2D context unavailable.");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;

      const result = await worker.recognize(canvas);
      out.push({
        pageNumber,
        lines: normalizeTextLines(result.data.text),
        confidence: Number.isFinite(result.data.confidence) ? result.data.confidence : 0,
      });
      completed += 1;
      onProgress?.(completed, uniquePageNumbers.length, 0);
      page.cleanup();
    }
  } finally {
    await worker.terminate();
    doc.cleanup();
  }

  return out;
}

function normalizeTextLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export const COMPRESSION_PRESETS = {
  low: { scale: 1.0, quality: 0.92 },
  medium: { scale: 1.45, quality: 0.84 },
  high: { scale: 1.9, quality: 0.78 },
} as const;

export type CompressionLevel = keyof typeof COMPRESSION_PRESETS;
