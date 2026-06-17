import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  File as FileIcon,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Download,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { Tool } from "@/lib/tools";
import { processTool, ComingSoonError } from "@/lib/processor";
import { cn } from "@/lib/utils";

type Status = "idle" | "ready" | "processing" | "success" | "error";

interface Props {
  tool: Tool;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadZone({ tool }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string>("output");
  const [opts, setOpts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    tool.configOptions?.forEach((o) => {
      if (o.defaultValue !== undefined) init[o.key] = String(o.defaultValue);
    });
    return init;
  });

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted.length) return;
      setError(null);
      setFiles((prev) => (tool.multiple ? [...prev, ...accepted] : accepted.slice(0, 1)));
      setStatus("ready");
    },
    [tool.multiple],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: tool.accept,
    multiple: tool.multiple,
    noClick: status === "processing",
  });

  const acceptedLabel = useMemo(
    () => Object.values(tool.accept).flat().join(", ").toUpperCase().replace(/\./g, ""),
    [tool.accept],
  );

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (!next.length) setStatus("idle");
      return next;
    });
  };

  const handleProcess = async () => {
    if (!files.length) return;
    setStatus("processing");
    setProgress(5);
    setError(null);
    try {
      const result = await processTool(tool, files, opts, setProgress);
      const url = URL.createObjectURL(result.blob);
      setResultUrl(url);
      setResultName(result.filename);
      setStatus("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  };

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setError(null);
  };

  return (
    <div className="space-y-5">
      {/* Dropzone — hidden when success */}
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
                "group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed bg-surface/50 px-8 py-14 text-center transition-all duration-200",
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
                <Upload className="h-5 w-5 text-foreground" strokeWidth={2} />
              </motion.div>
              <div className="mt-5">
                <div className="font-display text-lg font-semibold tracking-tight text-foreground">
                  {isDragActive ? "Drop to upload" : tool.multiple ? "Drop files or click to browse" : "Drop a file or click to browse"}
                </div>
                <div className="mt-1.5 text-[13px] text-muted-foreground">
                  {acceptedLabel} · {tool.multiple ? "multiple files" : "single file"}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && status !== "success" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-2xl border border-border bg-background"
          >
            <ul className="divide-y divide-border">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium text-foreground">{f.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{formatBytes(f.size)}</div>
                  </div>
                  {status !== "processing" && (
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                      aria-label={`Remove ${f.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config options */}
      {tool.configOptions && status === "ready" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid gap-4 rounded-2xl border border-border bg-background p-5 sm:grid-cols-2"
        >
          {tool.configOptions.map((opt) => (
            <label key={opt.key} className="space-y-1.5">
              <span className="block text-[12.5px] font-medium text-foreground">{opt.label}</span>
              {opt.type === "select" ? (
                <select
                  value={opts[opt.key] ?? ""}
                  onChange={(e) => setOpts({ ...opts, [opt.key]: e.target.value })}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {opt.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={opt.type === "password" ? "password" : opt.type === "number" ? "number" : "text"}
                  value={opts[opt.key] ?? ""}
                  placeholder={opt.placeholder}
                  onChange={(e) => setOpts({ ...opts, [opt.key]: e.target.value })}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-[13px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              )}
            </label>
          ))}
        </motion.div>
      )}

      {/* Action / status panel */}
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
              onClick={handleProcess}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-5 text-[13.5px] font-medium text-background transition-all hover:bg-foreground/90 active:scale-[0.99]"
            >
              Process {files.length > 1 ? `${files.length} files` : "file"}
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
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <div className="flex-1">
                <div className="text-[13.5px] font-medium text-foreground">Processing…</div>
                <div className="text-[12px] text-muted-foreground">Working locally in your browser when possible.</div>
              </div>
              <div className="font-mono text-[12px] tabular-nums text-muted-foreground">{progress}%</div>
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
              <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
            </motion.div>
            <div className="mt-4 font-display text-lg font-semibold tracking-tight">Done</div>
            <div className="mt-1 text-[13px] text-muted-foreground">
              Your file is ready. We've already forgotten it.
            </div>
            <div className="mt-6 flex items-center justify-center gap-2">
              <a
                href={resultUrl}
                download={resultName}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-5 text-[13.5px] font-medium text-background transition-all hover:bg-foreground/90 active:scale-[0.99]"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-surface"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Process another
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
            <AlertCircle className="mt-0.5 h-4 w-4 text-error" />
            <div className="flex-1">
              <div className="text-[13.5px] font-medium text-foreground">Couldn't process that</div>
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
      <ShieldCheck className="h-3.5 w-3.5 text-success" />
      Files are automatically deleted after processing. No account required.
    </div>
  );
}
