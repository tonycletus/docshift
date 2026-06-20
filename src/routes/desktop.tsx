import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackIcon, LocalIcon } from "@/components/DocIcons";

export const Route = createFileRoute("/desktop")({
  head: () => ({
    meta: [
      { title: "Desktop — DocShift" },
      {
        name: "description",
        content:
          "DocShift for macOS, Windows, and Linux. A native desktop build of the PDF toolkit, built with Go and Wails. Coming soon.",
      },
      { property: "og:title", content: "DocShift Desktop" },
      {
        property: "og:description",
        content:
          "A native desktop build of DocShift for macOS, Windows, and Linux. Coming soon.",
      },
      { property: "og:url", content: "https://docshift.tonycletus.com/desktop" },
    ],
    links: [{ rel: "canonical", href: "https://docshift.tonycletus.com/desktop" }],
  }),
  component: DesktopPage,
});

type Platform = {
  name: string;
  tag: string;
  arch: string;
  glyph: string;
};

const platforms: Platform[] = [
  { name: "macOS", tag: "Apple Silicon & Intel", arch: ".dmg · universal", glyph: "" },
  { name: "Windows", tag: "Windows 10 & 11", arch: ".exe · x64", glyph: "⊞" },
  { name: "Linux", tag: "Ubuntu, Fedora, Arch", arch: ".AppImage · x64", glyph: "🐧" },
];

function DesktopPage() {
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
            DocShift on your desktop.
          </h1>
          <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
            The same toolkit, packaged as a native app for macOS, Windows, and Linux. Built with Go
            and Wails for a small footprint and fast startup. No tab to keep open, no upload, no
            account.
          </p>
        </section>

        <section className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {platforms.map((p) => (
            <DownloadCard key={p.name} platform={p} />
          ))}
        </section>

        <section className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
          <Feature
            title="Native performance"
            body="Open large PDFs without a browser tab in the way. The desktop app uses your full CPU and memory budget."
          />
          <Feature
            title="Offline by default"
            body="Install once, work anywhere. No network connection is required for any tool."
          />
          <Feature
            title="System integration"
            body="Right-click a PDF in Finder or Explorer and open it directly in DocShift. Drag and drop works the same as the web app."
          />
          <Feature
            title="Auto updates"
            body="Signed builds with delta updates. Stay current without re-downloading the full installer."
          />
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-surface/40 p-5">
          <div className="text-[13px] font-medium text-foreground">Get notified at launch</div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            The desktop build is in development. Follow{" "}
            <a
              href="https://x.com/iamtonycletus"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              @iamtonycletus
            </a>{" "}
            or watch the{" "}
            <a
              href="https://github.com/tonycletus/docshift"
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              GitHub repo
            </a>{" "}
            for release notes.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DownloadCard({ platform }: { platform: Platform }) {
  return (
    <div className="flex flex-col gap-4 bg-background p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface font-display text-[15px] text-foreground">
          {platform.glyph}
        </div>
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          Soon
        </span>
      </div>
      <div>
        <div className="text-[14px] font-semibold text-foreground">{platform.name}</div>
        <div className="mt-1 text-[12px] text-muted-foreground">{platform.tag}</div>
      </div>
      <button
        type="button"
        disabled
        className="mt-auto inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface/60 px-3 text-[12.5px] font-medium text-muted-foreground"
      >
        {platform.arch}
      </button>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-background p-5">
      <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
