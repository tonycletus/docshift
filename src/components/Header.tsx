import { Link } from "@tanstack/react-router";
import { GitHubIcon, Wordmark } from "@/components/DocIcons";

const GITHUB_URL = "https://github.com/tonycletus/docshift";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-6">
        <Link
          to="/"
          aria-label="Docshift home"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          <Wordmark />
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
