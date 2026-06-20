import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackIcon, LocalIcon } from "@/components/DocIcons";

export const Route = createFileRoute("/cli")({
  head: () => ({
    meta: [
      { title: "CLI — DocShift" },
      {
        name: "description",
        content:
          "DocShift CLI brings every tool from the web app to your terminal. Merge, split, compress, convert, and protect PDFs from scripts and pipelines.",
      },
      { property: "og:title", content: "DocShift CLI" },
      {
        property: "og:description",
        content:
          "Every PDF tool from DocShift, available as a single binary in your terminal.",
      },
      { property: "og:url", content: "https://docshift.tonycletus.com/cli" },
    ],
    links: [{ rel: "canonical", href: "https://docshift.tonycletus.com/cli" }],
  }),
  component: CliPage,
});

const installers: { id: string; label: string; cmd: string }[] = [
  { id: "brew", label: "macOS · Homebrew", cmd: "brew install tonycletus/tap/docshift" },
  { id: "scoop", label: "Windows · Scoop", cmd: "scoop install docshift" },
  { id: "curl", label: "Linux · curl", cmd: "curl -fsSL https://docshift.tonycletus.com/install.sh | sh" },
  { id: "go", label: "Go", cmd: "go install github.com/tonycletus/docshift/cmd/docshift@latest" },
];

const examples: { title: string; body: string; cmd: string }[] = [
  {
    title: "Merge a folder of PDFs",
    body: "Combine every PDF in the current directory into a single file, in name order.",
    cmd: "docshift merge *.pdf -o combined.pdf",
  },
  {
    title: "Split by page range",
    body: "Pull pages 1-3 and 7 into their own file, leave the original alone.",
    cmd: "docshift split report.pdf --pages 1-3,7 -o excerpt.pdf",
  },
  {
    title: "Compress for email",
    body: "Re-encode images and strip metadata to hit a target size.",
    cmd: "docshift compress big.pdf --preset smaller -o small.pdf",
  },
  {
    title: "Protect with a password",
    body: "Encrypt with AES-256. The password is read from stdin, never logged.",
    cmd: "docshift protect contract.pdf --owner-from-stdin -o contract.locked.pdf",
  },
  {
    title: "Convert in a pipeline",
    body: "Render every page to JPG and pipe through ImageMagick.",
    cmd: "docshift pdf-to-jpg slides.pdf --out ./out && magick ./out/*.jpg slides.webp",
  },
];

function CliPage() {
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
            One static binary. Every tool from the website, scriptable from your shell, your
            Makefile, or a CI job. POSIX-friendly flags, stdin/stdout aware, and no telemetry.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <CommandBlock cmd="docshift --help" />
            <span className="font-mono text-[11.5px] text-muted-foreground">v0.1 · pre-release</span>
          </div>
        </section>

        <Section title="Install">
          <div className="grid gap-3 sm:grid-cols-2">
            {installers.map((i) => (
              <Installer key={i.id} label={i.label} cmd={i.cmd} />
            ))}
          </div>
        </Section>

        <Section title="Examples">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border">
            {examples.map((e) => (
              <div key={e.title} className="bg-background p-5">
                <div className="text-[14px] font-semibold text-foreground">{e.title}</div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{e.body}</p>
                <div className="mt-3">
                  <CommandBlock cmd={e.cmd} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Designed for pipelines">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
            <Feature
              title="Stdin / stdout aware"
              body="Pipe PDFs in and out. cat report.pdf | docshift compress - > small.pdf works."
            />
            <Feature
              title="Deterministic output"
              body="Same input, same flags, same bytes. Safe for caches and diffs in CI."
            />
            <Feature
              title="Exit codes that mean something"
              body="0 success, 1 user error, 2 input error, 3 processing error. Easy to branch on in scripts."
            />
            <Feature
              title="Zero network calls"
              body="No phone home, no auto-update without --update. Run it in air-gapped environments."
            />
          </div>
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

function Installer({ label, cmd }: { label: string; cmd: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="text-[12px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2">
        <CommandBlock cmd={cmd} />
      </div>
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

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-background p-5">
      <h3 className="text-[14px] font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
