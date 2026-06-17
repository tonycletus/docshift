import { Link } from "@tanstack/react-router";
import { tools } from "@/lib/tools";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border bg-surface/40">
      <div className="mx-auto max-w-[1280px] px-6 py-14">
        <div className="grid gap-12 md:grid-cols-[1fr_2fr]">
          <div>
            <div className="font-display text-base font-semibold tracking-tight">Docshift</div>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Free, open-source PDF tools. No login. No watermark. Files deleted automatically.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-[13px] sm:grid-cols-3">
            <div>
              <div className="mb-3 font-medium text-foreground">Organize</div>
              <ul className="space-y-2 text-muted-foreground">
                {tools.filter((t) => t.category === "organize").map((t) => (
                  <li key={t.slug}>
                    <Link to={t.route} className="transition-colors hover:text-foreground">{t.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-3 font-medium text-foreground">Convert</div>
              <ul className="space-y-2 text-muted-foreground">
                {tools.filter((t) => t.category === "convert").map((t) => (
                  <li key={t.slug}>
                    <Link to={t.route} className="transition-colors hover:text-foreground">{t.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-3 font-medium text-foreground">Edit &amp; Secure</div>
              <ul className="space-y-2 text-muted-foreground">
                {tools.filter((t) => t.category === "edit" || t.category === "security").map((t) => (
                  <li key={t.slug}>
                    <Link to={t.route} className="transition-colors hover:text-foreground">{t.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-[12px] text-muted-foreground sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} Docshift. Open source under MIT.</div>
          <div className="font-mono">v0.1.0 · privacy-first</div>
        </div>
      </div>
    </footer>
  );
}
