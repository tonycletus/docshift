import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BackIcon, LocalIcon } from "@/components/DocIcons";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CLI_PACKAGE, LATEST_RELEASE_URL, cliDownloads } from "@/lib/releases";
import { tools } from "@/lib/tools";

export const Route = createFileRoute("/cli")({
  head: () => ({
    meta: [
      { title: "CLI - DocShift" },
      {
        name: "description",
        content: "Private PDF tools in your terminal. Free, open source, and no uploads.",
      },
      { property: "og:title", content: "DocShift CLI" },
      {
        property: "og:description",
        content: "Private PDF tools in your terminal. Free, open source, and no uploads.",
      },
      { property: "og:url", content: "https://docshift.tonycletus.com/cli" },
    ],
    links: [{ rel: "canonical", href: "https://docshift.tonycletus.com/cli" }],
  }),
  component: CliPage,
});

type InstallId = "shell" | "powershell" | "npm" | "pnpm" | "release";

const installers: { id: InstallId; label: string; cmd: string; note: string }[] = [
  {
    id: "shell",
    label: "macOS/Linux script",
    cmd: `curl -fsSL ${cliDownloads.installSh} | sh`,
    note: "Installs the npm package.",
  },
  {
    id: "powershell",
    label: "Windows PowerShell",
    cmd: `irm ${cliDownloads.installPs1} | iex`,
    note: "Installs the npm package.",
  },
  {
    id: "npm",
    label: "npm",
    cmd: `npm install -g ${CLI_PACKAGE}`,
    note: "Requires Node 20+.",
  },
  {
    id: "pnpm",
    label: "pnpm",
    cmd: `pnpm add -g ${CLI_PACKAGE}`,
    note: "Requires Node 20+.",
  },
  {
    id: "release",
    label: "Release page",
    cmd: `open ${LATEST_RELEASE_URL}`,
    note: "Tarball and install scripts.",
  },
];

const installerById = Object.fromEntries(installers.map((i) => [i.id, i])) as Record<
  InstallId,
  (typeof installers)[number]
>;

function detectInstaller(): InstallId {
  if (typeof navigator === "undefined") return "shell";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "powershell";
  if (ua.includes("mac")) return "shell";
  if (ua.includes("linux") || ua.includes("x11")) return "shell";
  return "shell";
}

function detectLabel(id: InstallId): string {
  switch (id) {
    case "powershell":
      return "We detected Windows";
    case "shell":
      return "We detected macOS/Linux";
    default:
      return "Recommended installer";
  }
}

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

const commonFlags: Flag[] = [
  { flag: "-o, --output <path>", desc: "Write the result to a file or directory." },
  { flag: "--json", desc: "Emit a machine-readable summary where supported." },
  { flag: "-q, --quiet", desc: "Suppress non-error output." },
  { flag: "-h, --help", desc: "Show help for this command." },
];

function flagsForTool(slug: string): Flag[] {
  const flags: Flag[] = [];
  if (slug === "merge") flags.push({ flag: "<files...>", desc: "Two or more PDFs to merge." });
  if (slug === "split") flags.push({ flag: "--pages <ranges>", desc: "Ranges like 1-3,5." });
  if (slug === "ocr") {
    flags.push({
      flag: "embedded text",
      desc: "Scanned-page OCR is available in the browser and desktop app.",
    });
  }
  if (slug === "compress") {
    flags.push({ flag: "--preset <name>", desc: "safe, balanced, or smaller." });
  }
  if (slug === "protect") {
    flags.push({ flag: "-p, --password <value>", desc: "Set the PDF open password." });
    flags.push({ flag: "--password-from-stdin", desc: "Read a piped PDF open password." });
  }
  if (slug === "unlock") {
    flags.push({ flag: "-p, --password <value>", desc: "Use the existing PDF password." });
    flags.push({ flag: "--password-from-stdin", desc: "Read a piped existing password." });
  }
  if (slug === "watermark") {
    flags.push({ flag: "--text <string>", desc: "Text watermark. Default: CONFIDENTIAL." });
    flags.push({ flag: "--image <path>", desc: "Use an image watermark instead." });
  }
  if (["extract-pages", "delete-pages", "rotate"].includes(slug)) {
    flags.push({ flag: "--pages <ranges>", desc: "Apply to selected page ranges." });
  }
  if (slug === "rotate") flags.push({ flag: "--angle <deg>", desc: "90, 180, or 270." });
  if (slug === "reorder") flags.push({ flag: "--order <list>", desc: "New order, e.g. 3,1,2." });
  return [...flags, ...commonFlags];
}

function usageForTool(slug: string): string {
  if (slug === "merge") return "docshift merge <file...> -o combined.pdf";
  if (slug === "jpg-to-pdf") return "docshift jpg-to-pdf <image...> -o album.pdf";
  return `docshift ${slug} <input> [flags]`;
}

function exampleForTool(slug: string): string {
  switch (slug) {
    case "merge":
      return "docshift merge a.pdf b.pdf -o combined.pdf";
    case "compress":
      return "docshift compress large.pdf --preset balanced -o smaller.pdf";
    case "ocr":
      return "docshift ocr contract.pdf -o contract.txt";
    case "protect":
      return "docshift protect contract.pdf -p strong-password -o locked.pdf";
    case "watermark":
      return "docshift watermark draft.pdf --text DRAFT -o marked.pdf";
    case "reorder":
      return "docshift reorder deck.pdf --order 3,1,2 -o reordered.pdf";
    default:
      return `docshift ${slug} input.pdf -o output.pdf`;
  }
}

function helpOutput(command: Command): string {
  const flagLines = command.flags
    .map((flag) => `  ${flag.flag.padEnd(28)} ${flag.desc}`)
    .join("\n");
  return `Usage:
  ${command.usage}

${command.summary}

Flags:
${flagLines}

Example:
  ${command.example}`;
}

const cliToolSlugs = [
  "compress",
  "merge",
  "split",
  "ocr",
  "protect",
  "unlock",
  "watermark",
  "rotate",
  "delete-pages",
  "extract-pages",
  "reorder",
];

const toolCommands: Command[] = tools
  .filter((tool) => cliToolSlugs.includes(tool.slug))
  .map((tool) => {
    const command: Command = {
      name: tool.slug,
      summary:
        tool.slug === "ocr"
          ? "Extract embedded text. Scanned-page OCR runs in browser and desktop."
          : tool.description,
      usage: usageForTool(tool.slug),
      flags: flagsForTool(tool.slug),
      example: exampleForTool(tool.slug),
      helpOutput: "",
    };
    command.helpOutput = helpOutput(command);
    return command;
  });

const globalCommands: Command[] = [
  {
    name: "doctor",
    summary: "Check the local runtime and report anything that blocks CLI use.",
    usage: "docshift doctor",
    flags: [
      { flag: "--verbose", desc: "Print every check, not just failures." },
      { flag: "--json", desc: "Print the result as JSON." },
    ],
    example: "docshift doctor --verbose",
    helpOutput: "Usage:\n  docshift doctor\n\nChecks version, temp directory, and write access.",
  },
  {
    name: "version",
    summary: "Print CLI version and build metadata.",
    usage: "docshift version",
    flags: [{ flag: "--json", desc: "Print version info as JSON." }],
    example: "docshift version --json",
    helpOutput: "Usage:\n  docshift version\n\nPrints version, commit, build time, and runtime.",
  },
];

function CliPage() {
  const [picked, setPicked] = useState<InstallId>("shell");
  const [detected, setDetected] = useState<InstallId | null>(null);

  useEffect(() => {
    const id = detectInstaller();
    setDetected(id);
    setPicked(id);
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
            Release binary
          </div>
          <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
            Private PDF tools in your terminal.
          </h1>
          <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
            One command surface for DocShift workflows, scriptable from your shell, a Makefile, or
            CI. POSIX-friendly flags, predictable exit codes, JSON output where useful, and no
            telemetry. Every command supports <code className="font-mono">--help</code>.
          </p>
        </section>

        <Section title="Copy and install">
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
              {installers.map((installer) => (
                <button
                  key={installer.id}
                  type="button"
                  onClick={() => setPicked(installer.id)}
                  className={
                    "rounded-md border px-2.5 py-1 text-[11.5px] font-mono transition-colors " +
                    (installer.id === picked
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:text-foreground")
                  }
                >
                  {installer.label}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Verify the install">
          <div className="grid gap-3 sm:grid-cols-2">
            <CommandBlock cmd="docshift version" />
            <CommandBlock cmd="docshift doctor" />
          </div>
        </Section>

        <Section title="Global commands">
          <CommandTable commands={globalCommands} />
        </Section>

        <Section title="Command reference">
          <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">
            CLI command names mirror the web tool slugs, so scripts stay easy to remember. The same
            examples are included in the npm package README for users installing from npm.
          </p>
          <CommandTable commands={toolCommands} />
        </Section>

        <section className="mt-10 rounded-2xl border border-border bg-surface/40 p-5">
          <div className="text-[13px] font-medium text-foreground">Source layout</div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            The CLI lives under{" "}
            <code className="rounded bg-surface/60 px-1.5 py-0.5 font-mono text-[12px] text-foreground">
              packages/cli
            </code>{" "}
            and is released from GitHub Actions. See{" "}
            <a
              href={LATEST_RELEASE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              GitHub Releases
            </a>{" "}
            for binaries and checksums.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
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
      {commands.map((command, index) => {
        const isOpen = open === command.name;
        return (
          <div
            key={command.name}
            className={
              "bg-background " + (index !== commands.length - 1 ? "border-b border-border" : "")
            }
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : command.name)}
              className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
            >
              <div className="min-w-0">
                <code className="font-mono text-[13px] font-medium text-foreground">
                  docshift {command.name}
                </code>
                <span className="ml-3 hidden text-[12.5px] text-muted-foreground sm:inline">
                  {command.summary}
                </span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {isOpen ? "-" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-border bg-surface/30 px-5 py-4">
                <div className="text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  Usage
                </div>
                <div className="mt-1.5">
                  <CommandBlock cmd={command.usage} />
                </div>
                <div className="mt-4 text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  Flags
                </div>
                <div className="mt-2 overflow-hidden rounded-lg border border-border">
                  {command.flags.map((flag, i) => (
                    <div
                      key={flag.flag}
                      className={
                        "grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[260px_1fr] sm:gap-4 " +
                        (i !== command.flags.length - 1 ? "border-b border-border" : "")
                      }
                    >
                      <code className="font-mono text-[12px] text-foreground">{flag.flag}</code>
                      <span className="text-[12.5px] text-muted-foreground">{flag.desc}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-[11.5px] uppercase tracking-wide text-muted-foreground">
                  Example
                </div>
                <div className="mt-1.5">
                  <CommandBlock cmd={command.example} />
                </div>
                <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
                  {command.helpOutput}
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
    await navigator.clipboard.writeText(cmd).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
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
