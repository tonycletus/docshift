import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackIcon, LocalIcon } from "@/components/DocIcons";
import { tools } from "@/lib/tools";

export const Route = createFileRoute("/cli")({
  head: () => ({
    meta: [
      { title: "CLI — DocShift" },
      {
        name: "description",
        content:
          "DocShift CLI brings every PDF tool to your terminal. Install via npm, brew, scoop, or curl. Full command reference with flags, examples, and a doctor command.",
      },
      { property: "og:title", content: "DocShift CLI" },
      {
        property: "og:description",
        content:
          "Every PDF tool from DocShift, as a single command in your terminal. Scripts, pipelines, CI.",
      },
      { property: "og:url", content: "https://docshift.tonycletus.com/cli" },
    ],
    links: [{ rel: "canonical", href: "https://docshift.tonycletus.com/cli" }],
  }),
  component: CliPage,
});

// ---------- Install wizard ----------

type InstallId = "npm" | "pnpm" | "npx" | "brew" | "scoop" | "curl" | "go";

const installers: { id: InstallId; label: string; cmd: string; note: string }[] = [
  { id: "npm", label: "npm", cmd: "npm install -g docshift", note: "Node 18+. Cross-platform." },
  { id: "pnpm", label: "pnpm", cmd: "pnpm add -g docshift", note: "Same binary as npm, faster install." },
  { id: "npx", label: "npx (no install)", cmd: "npx docshift@latest --help", note: "Run once without installing." },
  { id: "brew", label: "Homebrew · macOS", cmd: "brew install tonycletus/tap/docshift", note: "Recommended for macOS." },
  { id: "scoop", label: "Scoop · Windows", cmd: "scoop install docshift", note: "Recommended for Windows." },
  { id: "curl", label: "curl · Linux", cmd: "curl -fsSL https://docshift.tonycletus.com/install.sh | sh", note: "Static binary, no runtime needed." },
  { id: "go", label: "Go", cmd: "go install github.com/tonycletus/docshift/cmd/docshift@latest", note: "Build from source with Go 1.22+." },
];

const installerById = Object.fromEntries(installers.map((i) => [i.id, i])) as Record<InstallId, typeof installers[number]>;

function detectInstaller(): InstallId {
  if (typeof navigator === "undefined") return "npm";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "brew";
  if (ua.includes("win")) return "scoop";
  if (ua.includes("linux") || ua.includes("x11")) return "curl";
  return "npm";
}

function detectLabel(id: InstallId): string {
  switch (id) {
    case "brew": return "We detected macOS";
    case "scoop": return "We detected Windows";
    case "curl": return "We detected Linux";
    default: return "Recommended for your setup";
  }
}

// ---------- Command reference ----------

interface Flag {
  flag: string;
  desc: string;
}

interface Command {
  name: string;
  summary: string;
  usage: string;
  flags: Flag[];
  example: string;
  helpOutput: string;
}

const COMMON_FLAGS: Flag[] = [
  { flag: "-o, --output <path>", desc: "Write result to <path>. Use - for stdout." },
  { flag: "-q, --quiet", desc: "Suppress non-error output." },
  { flag: "--json", desc: "Emit a machine-readable JSON summary." },
  { flag: "-h, --help", desc: "Show help for this command and exit." },
];

function flagsForTool(slug: string): Flag[] {
  const extra: Flag[] = [];
  switch (slug) {
    case "merge":
      extra.push({ flag: "<files...>", desc: "Two or more PDFs to merge, in order." });
      break;
    case "split":
      extra.push({ flag: "--pages <ranges>", desc: "Page ranges, e.g. 1-3,5,8-." });
      extra.push({ flag: "--each", desc: "Write one file per page." });
      break;
    case "compress":
      extra.push({ flag: "--preset <name>", desc: "low | medium | high. Default: medium." });
      extra.push({ flag: "--target-kb <n>", desc: "Try to hit a target size in kilobytes." });
      break;
    case "protect":
      extra.push({ flag: "--owner <password>", desc: "Owner password. Prefer --owner-from-stdin." });
      extra.push({ flag: "--owner-from-stdin", desc: "Read the password from stdin." });
      extra.push({ flag: "--algo <name>", desc: "aes-256 (default) | aes-128." });
      break;
    case "unlock":
      extra.push({ flag: "--password <pw>", desc: "PDF open password. Prefer --password-from-stdin." });
      extra.push({ flag: "--password-from-stdin", desc: "Read the password from stdin." });
      break;
    case "watermark":
      extra.push({ flag: "--text <string>", desc: "Watermark text. Default: CONFIDENTIAL." });
      extra.push({ flag: "--image <path>", desc: "Use an image watermark instead of text." });
      extra.push({ flag: "--opacity <0-1>", desc: "Watermark opacity. Default: 0.3." });
      break;
    case "page-numbers":
      extra.push({ flag: "--position <pos>", desc: "bottom-center | bottom-right | top-right." });
      extra.push({ flag: "--start <n>", desc: "First page number. Default: 1." });
      break;
    case "extract-pages":
    case "delete-pages":
      extra.push({ flag: "--pages <ranges>", desc: "Page ranges, e.g. 1,3-5." });
      break;
    case "rotate":
      extra.push({ flag: "--angle <deg>", desc: "90 | 180 | 270." });
      extra.push({ flag: "--pages <ranges>", desc: "Apply to specific pages only." });
      break;
    case "reorder":
      extra.push({ flag: "--order <list>", desc: "New order, e.g. 3,1,2,4." });
      break;
    case "jpg-to-pdf":
      extra.push({ flag: "<images...>", desc: "JPG or PNG files, in order." });
      extra.push({ flag: "--page-size <size>", desc: "auto | a4 | letter. Default: auto." });
      break;
    case "pdf-to-jpg":
      extra.push({ flag: "--dpi <n>", desc: "Render resolution. Default: 150." });
      break;
    case "pdf-to-word":
    case "pdf-to-excel":
    case "pdf-to-powerpoint":
    case "word-to-pdf":
    case "ocr":
      // no extra tool-specific flags beyond input/output
      break;
  }
  return [...extra, ...COMMON_FLAGS];
}

function usageForTool(slug: string): string {
  if (slug === "merge") return "docshift merge <file...> -o <out.pdf>";
  if (slug === "jpg-to-pdf") return "docshift jpg-to-pdf <image...> -o <out.pdf>";
  return `docshift ${slug} <input> [flags]`;
}

function exampleForTool(slug: string): string {
  switch (slug) {
    case "merge": return "docshift merge a.pdf b.pdf c.pdf -o combined.pdf";
    case "split": return "docshift split report.pdf --pages 1-3,7 -o excerpt.pdf";
    case "compress": return "docshift compress big.pdf --preset high -o small.pdf";
    case "protect": return "docshift protect contract.pdf --owner-from-stdin -o locked.pdf";
    case "unlock": return "docshift unlock locked.pdf --password-from-stdin -o open.pdf";
    case "watermark": return "docshift watermark doc.pdf --text DRAFT --opacity 0.25 -o draft.pdf";
    case "page-numbers": return "docshift page-numbers doc.pdf --position bottom-center -o numbered.pdf";
    case "extract-pages": return "docshift extract-pages book.pdf --pages 10-20 -o chapter.pdf";
    case "delete-pages": return "docshift delete-pages doc.pdf --pages 2,4-6 -o trimmed.pdf";
    case "rotate": return "docshift rotate scan.pdf --angle 90 -o fixed.pdf";
    case "reorder": return "docshift reorder deck.pdf --order 3,1,2,4 -o reordered.pdf";
    case "jpg-to-pdf": return "docshift jpg-to-pdf *.jpg -o album.pdf";
    case "pdf-to-jpg": return "docshift pdf-to-jpg slides.pdf --dpi 200 -o ./out";
    case "pdf-to-word": return "docshift pdf-to-word report.pdf -o report.docx";
    case "pdf-to-excel": return "docshift pdf-to-excel data.pdf -o data.xlsx";
    case "pdf-to-powerpoint": return "docshift pdf-to-powerpoint slides.pdf -o slides.pptx";
    case "word-to-pdf": return "docshift word-to-pdf brief.docx -o brief.pdf";
    case "ocr": return "docshift ocr scan.pdf -o scan.txt";
    default: return `docshift ${slug} input.pdf -o out.pdf`;
  }
}

function helpOutput(cmd: Command): string {
  const flagLines = cmd.flags.map((f) => `  ${f.flag.padEnd(28)} ${f.desc}`).join("\n");
  return `Usage:
  ${cmd.usage}

${cmd.summary}

Flags:
${flagLines}

Example:
  ${cmd.example}`;
}

const commands: Command[] = tools.map((t) => {
  const base: Command = {
    name: t.slug,
    summary: t.description,
    usage: usageForTool(t.slug),
    flags: flagsForTool(t.slug),
    example: exampleForTool(t.slug),
    helpOutput: "",
  };
  base.helpOutput = helpOutput(base);
  return base;
});

const globalCommands: Command[] = [
  {
    name: "doctor",
    summary: "Check your environment and report anything that would block a run.",
    usage: "docshift doctor",
    flags: [
      { flag: "--verbose", desc: "Print every check, not just failures." },
      { flag: "-h, --help", desc: "Show help and exit." },
    ],
    example: "docshift doctor --verbose",
    helpOutput: `Usage:
  docshift doctor

Runs environment checks:
  - CLI version and update status
  - Write access to the working directory
  - Temp directory available and writable
  - PDF engine (qpdf, pdfcpu) reachable
  - Optional: OCR engine present

Exit codes:
  0  all checks passed
  1  one or more checks failed`,
  },
  {
    name: "version",
    summary: "Print the CLI version and build metadata.",
    usage: "docshift version",
    flags: [
      { flag: "--json", desc: "Print version info as JSON." },
      { flag: "-h, --help", desc: "Show help and exit." },
    ],
    example: "docshift version --json",
    helpOutput: `Usage:
  docshift version

Prints:
  docshift 0.1.0
  commit:   abc1234
  built:    2026-06-20
  runtime:  go1.22 darwin/arm64`,
  },
  {
    name: "help",
    summary: "Show help for any command. Same as --help.",
    usage: "docshift help [command]",
    flags: [{ flag: "-h, --help", desc: "Show this message." }],
    example: "docshift help compress",
    helpOutput: `Usage:
  docshift help [command]

Without a command, lists every command. With a command, prints the same
output as 'docshift <command> --help'.`,
  },
];

// ---------- Page ----------

function CliPage() {
  const [picked, setPicked] = useState<InstallId>("npm");
  const [detected, setDetected] = useState<InstallId | null>(null);

  useEffect(() => {
    const d = detectInstaller();
    setDetected(d);
    setPicked(d);
  }, []);

  const best = installerById[picked];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[900px] px-6 pb-20 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <BackIcon className="h-3.5 w-3.5" />
          Back to tools
        </Link>

        <section className="mt-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-[12px] text-muted-foreground">
            <LocalIcon className="h-3.5 w-3.5" />
            Coming soon
          </div>
          <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
            DocShift in your terminal.
          </h1>
          <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
            One command. Every tool from the website, scriptable from your shell, a Makefile, or
            CI. POSIX-friendly flags, stdin and stdout aware, no telemetry.
          </p>
        </section>

        {/* Install wizard */}
        <Section title="Copy & Install">
          <div className="rounded-2xl border border-border bg-surface/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[12px] uppercase tracking-wide text-muted-foreground">
                  {detected ? detectLabel(detected) : "Pick your installer"}
                </div>
                <div className="mt-1 text-[14px] font-medium text-foreground">{best.label}</div>
              </div>
              <span className="font-mono text-[11.5px] text-muted-foreground">{best.note}</span>
            </div>
            <div className="mt-4">
              <CommandBlock cmd={best.cmd} />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {installers.map((i) => {
                const active = i.id === picked;
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setPicked(i.id)}
                    className={
                      "rounded-md border px-2.5 py-1 text-[11.5px] font-mono transition-colors " +
                      (active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-muted-foreground hover:text-foreground")
                    }
                  >
                    {i.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {installers.map((i) => (
              <div key={i.id} className="rounded-xl border border-border bg-background p-4">
                <div className="text-[12px] uppercase tracking-wide text-muted-foreground">
                  {i.label}
                </div>
                <div className="mt-2">
                  <CommandBlock cmd={i.cmd} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Verify */}
        <Section title="Verify the install">
          <div className="grid gap-3 sm:grid-cols-2">
            <CommandBlock cmd="docshift version" />
            <CommandBlock cmd="docshift doctor" />
          </div>
        </Section>

        {/* Global commands */}
        <Section title="Global commands">
          <CommandTable commands={globalCommands} />
        </Section>

        {/* Per-tool reference */}
        <Section title="Command reference">
          <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">
            Every web tool is mirrored 1:1 in the CLI. Run{" "}
            <code className="rounded bg-surface/60 px-1.5 py-0.5 font-mono text-[12px] text-foreground">
              docshift &lt;command&gt; --help
            </code>{" "}
            for the same output shown below.
          </p>
          <CommandTable commands={commands} />
        </Section>

        <section className="mt-10 rounded-2xl border border-border bg-surface/40 p-5">
          <div className="text-[13px] font-medium text-foreground">Status</div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            The CLI is being built alongside the desktop app. Track progress on{" "}
            <a
              href="https://github.com/tonycletus/docshift"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-foreground">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function CommandTable({ commands }: { commands: Command[] }) {
  const [open, setOpen] = useState<string | null>(commands[0]?.name ?? null);
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {commands.map((c, idx) => {
        const isOpen = open === c.name;
        return (
          <div
            key={c.name}
            className={
              "bg-background " + (idx !== commands.length - 1 ? "border-b border-border" : "")
            }
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : c.name)}
              className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
            >
              <div className="flex items-center gap-3">
                <code className="font-mono text-[13px] font-medium text-foreground">
                  docshift {c.name}
                </code>
                <span className="hidden text-[12.5px] text-muted-foreground sm:inline">
                  {c.summary}
                </span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-border bg-surface/30 px-5 py-4">
                <div className="text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  Usage
                </div>
                <div className="mt-1.5">
                  <CommandBlock cmd={c.usage} />
                </div>

                <div className="mt-4 text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  Flags
                </div>
                <div className="mt-2 overflow-hidden rounded-lg border border-border">
                  {c.flags.map((f, i) => (
                    <div
                      key={f.flag}
                      className={
                        "grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[260px_1fr] sm:gap-4 " +
                        (i !== c.flags.length - 1 ? "border-b border-border" : "")
                      }
                    >
                      <code className="font-mono text-[12px] text-foreground">{f.flag}</code>
                      <span className="text-[12.5px] text-muted-foreground">{f.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  Example
                </div>
                <div className="mt-1.5">
                  <CommandBlock cmd={c.example} />
                </div>

                <div className="mt-4 text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  docshift {c.name} --help
                </div>
                <pre className="mt-1.5 overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
{c.helpOutput}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CommandBlock({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };
  return (
    <div className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/60 px-3 py-2">
      <code className="overflow-x-auto whitespace-pre font-mono text-[12.5px] text-foreground">
        <span className="text-muted-foreground">$ </span>
        {cmd}
      </code>
      <button
        type="button"
        onClick={onCopy}
        className="shrink-0 rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Copy command"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

// useMemo retained import guard
void useMemo;
