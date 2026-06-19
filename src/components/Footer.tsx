import { Link } from "@tanstack/react-router";
import { tools } from "@/lib/tools";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface/40">
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
          <div>
            <div className="font-display text-base font-semibold tracking-tight">Docshift</div>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Free PDF tools. No login. No watermark. Files stay in your browser.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-[13px] sm:grid-cols-3">
            <div>
              <div className="mb-3 font-medium text-foreground">Organize</div>
              <ul className="space-y-2 text-muted-foreground">
                {tools
                  .filter((t) => t.category === "organize")
                  .map((t) => (
                    <li key={t.slug}>
                      <Link to={t.route} className="transition-colors hover:text-foreground">
                        {t.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <div className="mb-3 font-medium text-foreground">Convert</div>
              <ul className="space-y-2 text-muted-foreground">
                {tools
                  .filter((t) => t.category === "convert")
                  .map((t) => (
                    <li key={t.slug}>
                      <Link to={t.route} className="transition-colors hover:text-foreground">
                        {t.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <div className="mb-3 font-medium text-foreground">Edit &amp; Secure</div>
              <ul className="space-y-2 text-muted-foreground">
                {tools
                  .filter((t) => t.category === "edit" || t.category === "security")
                  .map((t) => (
                    <li key={t.slug}>
                      <Link to={t.route} className="transition-colors hover:text-foreground">
                        {t.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 rounded-2xl border border-border bg-background p-6">
          <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">About</div>
          <div className="mt-2 font-display text-[18px] font-semibold tracking-tight text-foreground">
            Hi, I&apos;m Tony Cletus
          </div>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
            I&apos;m a builder who loves shipping small tools that remove friction. I built Docshift because I was tired of uploading sensitive documents to random online PDF tools — your files should never leave your device.
          </p>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-muted-foreground">
            Docshift is the tool I wished existed: open it, drop your PDF, do what you need — no accounts, no uploads, no trace left behind.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px]">
            <a
              href="https://github.com/tonycletus"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              github.com/tonycletus
            </a>
            <a
              href="https://x.com/iamtonycletus"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              @iamtonycletus
            </a>
          </div>
        </div>
        <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-border pt-5 text-[12px] text-muted-foreground sm:flex-row sm:items-center">
          <div>
            Copyright {new Date().getFullYear()} Docshift | Built by{" "}
            <a
              href="https://x.com/iamtonycletus"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Tony Cletus
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <div className="font-mono">v0.1.0</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
