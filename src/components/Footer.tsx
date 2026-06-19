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
        <div className="mt-10 flex justify-center">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-background p-6 sm:p-8">
            <div className="flex flex-col items-center gap-5 text-center">
              <a
                href="https://github.com/tonycletus"
                target="_blank"
                rel="noreferrer"
                className="shrink-0"
                aria-label="Tony Cletus on GitHub"
              >
                <img
                  src="https://github.com/tonycletus.png"
                  alt="Tony Cletus"
                  loading="lazy"
                  className="h-24 w-24 rounded-full border border-border object-cover"
                />
              </a>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">About</div>
                <div className="mt-2 font-display text-[18px] font-semibold tracking-tight text-foreground">
                  Hi, I&apos;m Tony Cletus
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                  I build small tools that solve everyday problems. Docshift started because my family and friends kept asking me for help with basic PDF tasks: merging a few pages, compressing a scan, splitting a document before sending it off. Most of the online options wanted accounts, uploads, or payment for things that should be simple.
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                  So I built Docshift for them, and made it free for everyone. Everything runs in your browser, your files never leave your device, and there is nothing to sign up for.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 text-[13px]">
                <a
                  href="https://github.com/tonycletus"
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  github.com/tonycletus
                </a>
                <span className="text-border">|</span>
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
