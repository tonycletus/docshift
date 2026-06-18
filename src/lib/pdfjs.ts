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
  pageNumber: number;
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
    const content = await page.getTextContent();

    for (const item of content.items as Array<{ str?: string; transform?: number[] }>) {
      const text = item.str?.trim();
      if (!text) continue;
      rows.push({
        text,
        x: item.transform?.[4] ?? 0,
        y: item.transform?.[5] ?? 0,
        pageNumber: i,
      });
    }
    page.cleanup();
  }

  doc.cleanup();
  return rows;
}

export const COMPRESSION_PRESETS = {
  low: { scale: 1.0, quality: 0.92 },
  medium: { scale: 1.45, quality: 0.84 },
  high: { scale: 1.9, quality: 0.78 },
} as const;

export type CompressionLevel = keyof typeof COMPRESSION_PRESETS;
