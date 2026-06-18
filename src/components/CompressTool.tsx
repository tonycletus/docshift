import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertIcon,
  BalancedIcon,
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  FileGlyphIcon,
  LoaderIcon,
  RefreshIcon,
  SafeIcon,
  ShieldIcon,
  SmallerIcon,
  UploadIcon,
  type DocIcon,
} from "@/components/DocIcons";
import type { Tool } from "@/lib/tools";
import { processTool } from "@/lib/processor";
import { cn } from "@/lib/utils";

type Status = "idle" | "ready" | "processing" | "success" | "error";
type CompressionLevel = "low" | "medium" | "high";
type CompressionMeta = NonNullable<Awaited<ReturnType<typeof processTool>>["meta"]>["compression"];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024;

const LEVELS: {
  key: CompressionLevel;
  label: string;
  tagline: string;
  detail: string;
  icon: DocIcon;
}[] = [
  {
    key: "low",
    label: "Safe",
    tagline: "Best quality",
    detail: "Lossless cleanup only. Never rasterizes text.",
    icon: SafeIcon,
  },
  {
    key: "medium",
    label: "Balanced",
    tagline: "Smart",
    detail: "Tries image compression only when it can safely reduce size.",
    icon: BalancedIcon,
  },
  {
    key: "high",
    label: "Smaller",
    tagline: "Smallest file",
    detail: "Tests stronger image compression, but keeps the original if safe savings fail.",
    icon: SmallerIcon,
  },
];

interface Props {
  tool: Tool;
}

export function CompressTool({ tool }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>("medium");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Preparing...");
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string>("compressed.pdf");
  const [resultSize, setResultSize] = useState<number>(0);
  const [compressionMeta, setCompressionMeta] = useState<CompressionMeta | undefined>();

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted.length) return;
    setError(null);
    setFile(accepted[0]);
    setStatus("ready");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: tool.accept,
    multiple: false,
    noClick: status === "processing",
  });

  const handleProcessWithLabel = async () => {
    if (!file) return;
    setStatus("processing");
    setProgress(5);
    setProgressLabel("Preparing PDF...");
    setError(null);
    try {
      // Estimate page count by reading the PDF header. pdf-lib loads quickly.
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
        updateMetadata: false,
      });
      const totalPages = doc.getPageCount();

      const result = await processTool(tool, [file], { level }, (pct) => {
        setProgress(pct);
        if (pct < 20) {
          setProgressLabel("Checking for quality-safe savings...");
        } else if (pct >= 20 && pct < 90) {
          const ratio = (pct - 10) / 80;
          const page = Math.min(totalPages, Math.max(1, Math.round(ratio * totalPages)));
          setProgressLabel(`Testing page ${page} of ${totalPages}...`);
        } else if (pct >= 90) {
          setProgressLabel("Choosing the best quality-safe result...");
        }
      });
      const url = URL.createObjectURL(result.blob);
      setResultUrl(url);
      setResultName(result.filename);
      setCompressionMeta(result.meta?.compression);
      setResultSize(result.meta?.compression?.outputSize ?? result.blob.size);
      setProgress(100);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setFile(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
    setResultSize(0);
    setCompressionMeta(undefined);
  };

  const originalSize = compressionMeta?.originalSize ?? file?.size ?? 0;
  const reduction =
    originalSize > 0 && resultSize > 0
      ? Math.max(0, Math.round(((originalSize - resultSize) / originalSize) * 100))
      : 0;
  const alreadyOptimized = compressionMeta?.status === "already-optimized";

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
                "group relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed bg-surface/50 px-8 py-10 text-center transition-all duration-200",
                isDragActive
                  ? "border-primary bg-primary/5 scale-[1.005]"
                  : "border-border hover:border-foreground/30 hover:bg-surface",
                status === "processing" && "pointer-events-none",
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
                  PDF - single file - processed in your browser
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {file && status !== "success" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-2xl border border-border bg-background"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface">
                <FileGlyphIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-medium text-foreground">
                  {file.name}
                </div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  Original size - {formatBytes(file.size)}
                </div>
              </div>
              {status !== "processing" && (
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
            {file.size >= LARGE_FILE_THRESHOLD && (
              <div className="flex items-start gap-2 border-t border-border bg-warning/5 px-4 py-3 text-[12.5px] text-foreground">
                <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <span>
                  This is a large PDF ({formatBytes(file.size)}). Processing happens in your browser
                  and may take a moment, so please keep this tab open.
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {status === "ready" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Compression level
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {LEVELS.map((l) => {
              const Icon = l.icon;
              const active = level === l.key;
              return (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLevel(l.key)}
                  className={cn(
                    "group relative flex flex-col items-start gap-2 rounded-2xl border bg-background p-4 text-left transition-all duration-200",
                    active
                      ? "border-foreground shadow-subtle"
                      : "border-border hover:border-foreground/30 hover:bg-surface",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                      active ? "bg-foreground text-background" : "bg-surface text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">
                      {l.label}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">{l.tagline}</span>
                  </div>
                  <span className="text-[12.5px] leading-snug text-muted-foreground">
                    {l.detail}
                  </span>
                  {active && (
                    <motion.span
                      layoutId="level-dot"
                      className="absolute right-3 top-3 h-2 w-2 rounded-full bg-foreground"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {status === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <PrivacyNote />
            <button
              type="button"
              onClick={handleProcessWithLabel}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-5 text-[13.5px] font-medium text-background transition-all hover:bg-foreground/90 active:scale-[0.99]"
            >
              Compress PDF
            </button>
          </motion.div>
        )}

        {status === "processing" && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-background p-5"
          >
            <div className="flex items-center gap-3">
              <LoaderIcon className="h-4 w-4 animate-spin text-primary" />
              <div className="flex-1">
                <div className="text-[13.5px] font-medium text-foreground">{progressLabel}</div>
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
          </motion.div>
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
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success"
            >
              <CheckIcon className="h-6 w-6" />
            </motion.div>
            <div className="mt-4 font-display text-lg font-semibold tracking-tight">
              {alreadyOptimized ? "Already optimized" : "Done"}
            </div>
            <div className="mt-1 text-[13px] text-muted-foreground">
              {compressionMeta?.message ?? "Your file is ready. It never left this device."}
            </div>

            <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border text-left">
              <div className="bg-background p-4">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  Original
                </div>
                <div className="mt-1 font-display text-[15px] font-semibold tracking-tight text-foreground">
                  {formatBytes(originalSize)}
                </div>
              </div>
              <div className="bg-background p-4">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  Output
                </div>
                <div className="mt-1 font-display text-[15px] font-semibold tracking-tight text-foreground">
                  {formatBytes(resultSize)}
                </div>
              </div>
              <div className="bg-background p-4">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  Saved
                </div>
                <div
                  className={cn(
                    "mt-1 font-display text-[15px] font-semibold tracking-tight",
                    reduction > 0 ? "text-success" : "text-muted-foreground",
                  )}
                >
                  {reduction > 0 ? `${reduction}%` : "0%"}
                </div>
              </div>
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
                Compress another
              </button>
            </div>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-3 rounded-2xl border border-error/30 bg-error/5 p-4"
          >
            <AlertIcon className="mt-0.5 h-4 w-4 text-error" />
            <div className="flex-1">
              <div className="text-[13.5px] font-medium text-foreground">
                Couldn't compress that
              </div>
              <div className="mt-0.5 text-[12.5px] text-muted-foreground">{error}</div>
            </div>
            <button
              type="button"
              onClick={() => setStatus("ready")}
              className="rounded-md px-2 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-surface"
            >
              Try again
            </button>
          </motion.div>
        )}

        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PrivacyNote />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
      <ShieldIcon className="h-3.5 w-3.5 text-success" />
      Files are processed locally in your browser. Nothing is uploaded.
    </div>
  );
}
