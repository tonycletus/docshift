import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PWAInstall } from "@/components/PWAInstall";
import { AppleIcon, BackIcon, LinuxIcon, LocalIcon, WindowsIcon } from "@/components/DocIcons";
import { LATEST_RELEASE_URL, desktopDownloads } from "@/lib/releases";

export const Route = createFileRoute("/desktop")({
  head: () => ({
    meta: [
      { title: "Desktop - DocShift" },
      {
        name: "description",
        content: "Private PDF tools for Windows, macOS, and Linux. No uploads.",
      },
      { property: "og:title", content: "DocShift Desktop" },
      {
        property: "og:description",
        content: "Private PDF tools for Windows, macOS, and Linux. No uploads.",
      },
      { property: "og:url", content: "https://docshift.tonycletus.com/desktop" },
    ],
    links: [{ rel: "canonical", href: "https://docshift.tonycletus.com/desktop" }],
  }),
  component: DesktopPage,
});

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
            Native releases
          </div>
          <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
            Private PDF tools on your desktop.
          </h1>
          <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-muted-foreground">
            The same local-first toolkit, packaged as a native app for macOS, Windows, and Linux.
            Built with Go and Wails for a small footprint and fast startup. No tab to keep open, no
            upload, no account.
          </p>
        </section>

        <section className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {desktopDownloads.map((platform) => (
            <DownloadCard key={platform.platform} platform={platform} />
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-surface/40 p-5">
          <div className="text-[13px] font-medium text-foreground">
            Prefer installing from the browser?
          </div>
          <div className="mt-3">
            <PWAInstall />
          </div>
        </section>

        <section className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
          <Feature
            title="Native performance"
            body="Open DocShift in its own OS window with the same local PDF engine used by the web app."
          />
          <Feature
            title="Offline by default"
            body="Install once, work anywhere. No network connection is required for any tool."
          />
          <Feature
            title="Same source of truth"
            body="Desktop builds reuse the same React frontend and local PDF processing code as the website."
          />
          <Feature
            title="Release artifacts"
            body="Windows, macOS, and Linux packages are prepared from GitHub Releases with stable latest download URLs."
          />
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-surface/40 p-5">
          <div className="text-[13px] font-medium text-foreground">Release notes</div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            Desktop builds are published from the repository release workflow. Watch the{" "}
            <a
              href={LATEST_RELEASE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              latest GitHub release
            </a>{" "}
            for checksums, notes, and versioned artifacts.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DownloadCard({ platform }: { platform: (typeof desktopDownloads)[number] }) {
  const PlatformIcon =
    platform.platform === "Windows"
      ? WindowsIcon
      : platform.platform === "macOS"
        ? AppleIcon
        : LinuxIcon;

  return (
    <div className="flex flex-col gap-4 bg-background p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-foreground">
          <PlatformIcon className="h-[18px] w-[18px]" />
        </div>
        <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
          Latest
        </span>
      </div>
      <div>
        <div className="text-[14px] font-semibold text-foreground">{platform.platform}</div>
        <div className="mt-1 text-[12px] text-muted-foreground">{platform.label}</div>
      </div>
      <a
        href={platform.href}
        className="mt-auto inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface/60 px-3 text-[12.5px] font-medium text-foreground transition-colors hover:bg-surface"
      >
        {platform.arch}
      </a>
      <div className="font-mono text-[10.5px] text-muted-foreground">{platform.artifact}</div>
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
