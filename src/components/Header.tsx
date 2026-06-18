import { Link } from "@tanstack/react-router";
import { BrandMark, GitHubIcon } from "@/components/DocIcons";

const GITHUB_URL = "https://github.com/tonycletus/docshift";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
            <BrandMark className="h-4 w-4" />
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight">Docshift</span>
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
          <Link to="/" hash="tools" className="transition-colors hover:text-foreground">
            Tools
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
        </nav>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-3 text-[12.5px] font-medium text-foreground transition-colors hover:bg-surface"
          aria-label="Open Docshift on GitHub"
        >
          <GitHubIcon className="h-4 w-4" />
          <span className="hidden sm:inline">GitHub</span>
          <span className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            0
          </span>
        </a>
      </div>
    </header>
  );
}
