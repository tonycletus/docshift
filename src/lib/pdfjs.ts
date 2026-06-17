// Client-only helpers around pdfjs-dist. Always import this module via
// dynamic import() inside an event handler — pdfjs-dist touches `window`
// and breaks SSR otherwise.
import * as pdfjsLib from "pdfjs-dist";

// Match the worker version to the installed library version exactly.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface RasterizedPage {
  blob: Blob;
  width: number;
  height: number;
}

export interface RasterizeOptions {
  /** Render scale applied on top of the PDF's natural size at 72 DPI. */
  scale: number;
  /** JPEG quality, 0–1. */
  quality: number;
  onProgress?: (currentPage: number, totalPages: number) => void;
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
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    // White background — JPEG has no alpha channel.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Failed to encode page"))),
        "image/jpeg",
        quality,
      ),
    );
    out.push({ blob, width: canvas.width, height: canvas.height });
    page.cleanup();
  }
  await doc.destroy();
  return out;
}

export const COMPRESSION_PRESETS = {
  low: { scale: 1.0, quality: 0.85 },
  medium: { scale: 0.9, quality: 0.6 },
  high: { scale: 0.75, quality: 0.35 },
} as const;

export type CompressionLevel = keyof typeof COMPRESSION_PRESETS;
