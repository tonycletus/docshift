import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  DownIcon,
  FileGlyphIcon,
  GripIcon,
  LoaderIcon,
  RefreshIcon,
  ShieldIcon,
  UpIcon,
  UploadIcon,
} from "@/components/DocIcons";
import type { Tool } from "@/lib/tools";
import { processTool } from "@/lib/processor";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "ready" | "processing" | "success" | "error";

interface PagePreview {
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ReorderTool({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("reordered.pdf");

  const order = useMemo(() => pages.map((page) => page.pageNumber).join(","), [pages]);
  const hasChangedOrder = useMemo(
    () => pages.some((page, index) => page.pageNumber !== index + 1),
    [pages],
  );

  const cleanupPreviews = useCallback((previews: PagePreview[]) => {
    previews.forEach((preview) => URL.revokeObjectURL(preview.imageUrl));
  }, []);

  const loadPreview = useCallback(
    async (nextFile: File) => {
      setStatus("loading");
      setProgress(5);
      setError(null);
      cleanupPreviews(pages);
      setPages([]);

      try {
        const { rasterizePdf } = await import("@/lib/pdfjs");
        const rendered = await rasterizePdf(nextFile, {
          scale: 0.45,
          quality: 0.78,
          onProgress: (current, total) => setProgress(10 + Math.round((current / total) * 80)),
        });
        const previews = rendered.map((page, index) => ({
          pageNumber: index + 1,
          imageUrl: URL.createObjectURL(page.blob),
          width: page.width,
          height: page.height,
        }));
        setPages(previews);
        setProgress(100);
        setStatus("ready");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not preview this PDF.");
        setStatus("error");
      }
    },
    [cleanupPreviews, pages],
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted.length) return;
      const nextFile = accepted[0];
      setFile(nextFile);
      void loadPreview(nextFile);
    },
    [loadPreview],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: tool.accept,
    multiple: false,
    noClick: status === "processing" || status === "loading",
  });

  const reset = () => {
    cleanupPreviews(pages);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPages([]);
    setStatus("idle");
    setError(null);
    setProgress(0);
    setDraggedIndex(null);
    setResultUrl(null);
    setResultName("reordered.pdf");
  };

  const handleProcess = async () => {
    if (!file) return;
    setStatus("processing");
    setProgress(5);
    setError(null);
    try {
      const result = await processTool(tool, [file], { order }, setProgress);
      const url = URL.createObjectURL(result.blob);
      setResultUrl(url);
      setResultName(result.filename);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reorder this PDF.");
      setStatus("error");
    }
  };

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {status !== "success" && (
          <motion.div
            key="zone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              {...getRootProps()}
              className={cn(
                "group relative flex min-h-[190px] cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed bg-surface/50 px-8 py-10 text-center transition-all duration-200",
                isDragActive
                  ? "border-primary bg-primary/5 scale-[1.005]"
                  : "border-border hover:border-foreground/30 hover:bg-surface",
                (status === "processing" || status === "loading") && "pointer-events-none",
              )}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={{ y: isDragActive ? -4 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-subtle ring-1 ring-border"
              >
                <UploadIcon className="h-5 w-5 text-foreground" />
              </motion.div>
              <div className="mt-5">
                <div className="font-display text-lg font-semibold tracking-tight text-foreground">
                  {isDragActive ? "Drop to upload" : "Drop a PDF or click to browse"}
                </div>
                <div className="mt-1.5 text-[13px] text-muted-foreground">
                  Preview pages, drag to reorder, then download
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {file && status !== "success" && (
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface">
              <FileGlyphIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-medium text-foreground">{file.name}</div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {formatBytes(file.size)}
              </div>
            </div>
            {status !== "processing" && status !== "loading" && (
              <button
                type="button"
                onClick={reset}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                aria-label="Remove file"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {(status === "loading" || status === "processing") && (
        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="flex items-center gap-3">
            <LoaderIcon className="h-4 w-4 animate-spin text-primary" />
            <div className="flex-1">
              <div className="text-[13.5px] font-medium text-foreground">
                {status === "loading" ? "Building page previews..." : "Rebuilding PDF..."}
              </div>
              <div className="text-[12px] text-muted-foreground">
                Working locally. Your file never leaves your device.
              </div>
            </div>
            <div className="font-mono text-[12px] tabular-nums text-muted-foreground">
              {progress}%
            </div>
          </div>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-surface">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PrivacyNote />
            <button
              type="button"
              onClick={handleProcess}
              disabled={!pages.length}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-5 text-[13.5px] font-medium text-background transition-all hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
            >
              Rebuild PDF
            </button>
          </div>

          {!hasChangedOrder && (
            <div className="rounded-2xl border border-border bg-surface/60 px-4 py-3 text-[12.5px] text-muted-foreground">
              Drag a page card, or use the arrow buttons, to set the new order.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {pages.map((page, index) => (
              <div
                key={page.pageNumber}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedIndex === null) return;
                  setPages((current) => move(current, draggedIndex, index));
                  setDraggedIndex(null);
                }}
                onDragEnd={() => setDraggedIndex(null)}
                className={cn(
                  "group overflow-hidden rounded-2xl border bg-background shadow-subtle transition-all",
                  draggedIndex === index ? "border-foreground opacity-60" : "border-border",
                )}
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-foreground">
                    <GripIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Page {page.pageNumber}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">#{index + 1}</div>
                </div>
                <div className="bg-surface p-3">
                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="mx-auto aspect-[3/4] max-h-52 w-full rounded-lg border border-border bg-white object-contain"
                  />
                </div>
                <div className="flex border-t border-border">
                  <button
                    type="button"
                    onClick={() => setPages((current) => move(current, index, index - 1))}
                    disabled={index === 0}
                    className="flex h-9 flex-1 items-center justify-center text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label={`Move page ${page.pageNumber} earlier`}
                  >
                    <UpIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPages((current) => move(current, index, index + 1))}
                    disabled={index === pages.length - 1}
                    className="flex h-9 flex-1 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label={`Move page ${page.pageNumber} later`}
                  >
                    <DownIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "success" && resultUrl && (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[20px] border border-border bg-background p-8 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckIcon className="h-6 w-6" />
          </div>
          <div className="mt-4 font-display text-lg font-semibold tracking-tight">Done</div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            Your reordered PDF is ready. It never left this device.
          </div>
          <div className="mt-6 flex items-center justify-center gap-2">
            <a
              href={resultUrl}
              download={resultName}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-5 text-[13.5px] font-medium text-background transition-all hover:bg-foreground/90 active:scale-[0.99]"
            >
              <DownloadIcon className="h-4 w-4" />
              Download
            </a>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-surface"
            >
              <RefreshIcon className="h-3.5 w-3.5" />
              Reorder another
            </button>
          </div>
        </motion.div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3 rounded-2xl border border-error/30 bg-error/5 p-4">
          <AlertIcon className="mt-0.5 h-4 w-4 text-error" />
          <div className="flex-1">
            <div className="text-[13.5px] font-medium text-foreground">Could not reorder that</div>
            <div className="mt-0.5 text-[12.5px] text-muted-foreground">{error}</div>
          </div>
          <button
            type="button"
            onClick={() => (file ? void loadPreview(file) : reset())}
            className="rounded-md px-2 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-surface"
          >
            Try again
          </button>
        </div>
      )}

      {status === "idle" && <PrivacyNote />}
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
      <ShieldIcon className="h-3.5 w-3.5 text-success" />
      Files are processed locally on your device.
    </div>
  );
}
