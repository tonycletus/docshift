import { PDFDocument, degrees, StandardFonts, rgb } from "pdf-lib";
import type { Tool } from "./tools";

export type ProcessResult = {
  blob: Blob;
  filename: string;
};

function parseRanges(input: string, max: number): number[] {
  // returns 0-indexed page numbers
  const result = new Set<number>();
  const parts = input.split(/[,\s]+/).filter(Boolean);
  for (const p of parts) {
    const m = p.match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;
    const a = Math.max(1, parseInt(m[1], 10));
    const b = m[2] ? parseInt(m[2], 10) : a;
    for (let i = a; i <= Math.min(b, max); i++) result.add(i - 1);
  }
  return [...result].sort((x, y) => x - y);
}

async function readBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

export async function processTool(
  tool: Tool,
  files: File[],
  options: Record<string, string>,
  onProgress?: (pct: number) => void,
): Promise<ProcessResult> {
  onProgress?.(10);

  // Client-side handlers using pdf-lib
  switch (tool.slug) {
    case "merge": {
      const out = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const src = await PDFDocument.load(await readBytes(files[i]));
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
        onProgress?.(20 + Math.round((i / files.length) * 70));
      }
      const bytes = await out.save();
      onProgress?.(100);
      return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: "merged.pdf" };
    }
    case "jpg-to-pdf": {
      const out = await PDFDocument.create();
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const bytes = await readBytes(f);
        const isPng = f.type === "image/png";
        const img = isPng ? await out.embedPng(bytes) : await out.embedJpg(bytes);
        const page = out.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        onProgress?.(20 + Math.round((i / files.length) * 70));
      }
      const bytes = await out.save();
      onProgress?.(100);
      return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: "images.pdf" };
    }
    case "rotate": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const angle = parseInt(options.angle ?? "90", 10);
      src.getPages().forEach((p) => p.setRotation(degrees(angle)));
      const bytes = await src.save();
      onProgress?.(100);
      return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: "rotated.pdf" };
    }
    case "extract-pages": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const out = await PDFDocument.create();
      const indices = parseRanges(options.ranges ?? "", src.getPageCount());
      if (!indices.length) throw new Error("Specify at least one page range");
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      onProgress?.(100);
      return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: "extracted.pdf" };
    }
    case "delete-pages": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const total = src.getPageCount();
      const remove = new Set(parseRanges(options.ranges ?? "", total));
      const keep = Array.from({ length: total }, (_, i) => i).filter((i) => !remove.has(i));
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, keep);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      onProgress?.(100);
      return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: "trimmed.pdf" };
    }
    case "reorder": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const total = src.getPageCount();
      const order = (options.order ?? "")
        .split(/[,\s]+/)
        .filter(Boolean)
        .map((n) => parseInt(n, 10) - 1)
        .filter((n) => n >= 0 && n < total);
      if (!order.length) throw new Error("Specify a new page order");
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, order);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      onProgress?.(100);
      return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: "reordered.pdf" };
    }
    case "watermark": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const font = await src.embedFont(StandardFonts.HelveticaBold);
      const text = options.text || "CONFIDENTIAL";
      src.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const size = Math.min(width, height) * 0.12;
        page.drawText(text, {
          x: width / 2 - (text.length * size) / 4,
          y: height / 2,
          size,
          font,
          color: rgb(0.7, 0.7, 0.75),
          opacity: 0.25,
          rotate: degrees(45),
        });
      });
      const bytes = await src.save();
      onProgress?.(100);
      return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: "watermarked.pdf" };
    }
    case "page-numbers": {
      const src = await PDFDocument.load(await readBytes(files[0]));
      const font = await src.embedFont(StandardFonts.Helvetica);
      const pos = options.position || "bottom-center";
      const pages = src.getPages();
      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const label = `${i + 1} / ${pages.length}`;
        const size = 10;
        const tw = font.widthOfTextAtSize(label, size);
        let x = width / 2 - tw / 2;
        let y = 24;
        if (pos === "bottom-right") { x = width - tw - 24; y = 24; }
        if (pos === "top-right") { x = width - tw - 24; y = height - 24; }
        page.drawText(label, { x, y, size, font, color: rgb(0.3, 0.3, 0.35) });
      });
      const bytes = await src.save();
      onProgress?.(100);
      return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: "numbered.pdf" };
    }
    case "split": {
      // Single-PDF split: produce one PDF containing the chosen pages.
      // (Real ZIP packaging would need a zip lib — stubbed as single PDF for now.)
      const src = await PDFDocument.load(await readBytes(files[0]));
      const indices = parseRanges(options.ranges ?? "", src.getPageCount());
      if (!indices.length) throw new Error("Specify page ranges to split");
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      onProgress?.(100);
      return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), filename: "split.pdf" };
    }
  }

  // Server-bound tools — a real backend isn't wired up yet. Surface a clear,
  // user-facing message instead of returning a misleading placeholder file.
  onProgress?.(100);
  throw new ComingSoonError(
    `${tool.name} runs on a secure server-side pipeline we're still finishing. It's coming soon — in the meantime, every tool marked as “in-browser” works end-to-end with zero uploads.`,
  );
}

export class ComingSoonError extends Error {
  readonly comingSoon = true;
  constructor(message: string) {
    super(message);
    this.name = "ComingSoonError";
  }
}
