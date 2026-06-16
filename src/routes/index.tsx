import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShieldCheck, Zap, Github, ArrowRight, Lock, Eraser, UserX } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ToolGrid } from "@/components/ToolGrid";
import { tools } from "@/lib/tools";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDFly — Free PDF tools. No login. No watermark." },
      { name: "description", content: "18 fast, private, open-source PDF tools. Merge, split, convert, compress, protect — all in your browser." },
      { property: "og:title", content: "PDFly — Free PDF tools" },
      { property: "og:description", content: "18 fast, private, open-source PDF tools. No login. No watermark." },
    ],
  }),
  component: Index,
});

const ease = [0.22, 1, 0.36, 1] as const;

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-32 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.62_0.19_256/0.08),transparent_70%)]"
        />
        <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-20 sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="mx-auto max-w-[820px] text-center"
          >
            <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[12px] text-muted-foreground shadow-subtle">
              <span className="flex h-1.5 w-1.5 rounded-full bg-success" />
              <span>Open source · MIT licensed</span>
              <span className="mx-0.5 text-border">·</span>
              <span className="font-mono text-foreground">{tools.length} tools</span>
            </div>
            <h1 className="font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] text-foreground sm:text-[64px]">
              Free PDF tools.
              <br />
              <span className="text-muted-foreground">No login. No watermark.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-[540px] text-[16px] leading-relaxed text-muted-foreground">
              The fastest way to work with PDFs. Privacy-first, beautifully designed,
              and built for keyboards. Files never leave your browser when they don't have to.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                hash="tools"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-foreground px-5 text-[14px] font-medium text-background transition-all hover:bg-foreground/90 active:scale-[0.99]"
              >
                Explore tools
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-[13.5px] font-medium text-foreground transition-colors hover:bg-surface"
              >
                <Github className="h-4 w-4" />
                Star on GitHub
              </a>
            </div>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease }}
            className="mx-auto mt-16 grid max-w-[860px] grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3"
          >
            <TrustItem icon={Eraser} title="Auto-deleted" body="Files erased the moment we're done." />
            <TrustItem icon={UserX} title="No account" body="No sign-up. No email. No tracking." />
            <TrustItem icon={Lock} title="Open source" body="Audit the code, run it yourself." />
          </motion.div>
        </div>
      </section>

      {/* Tool grid */}
      <section id="tools" className="mx-auto max-w-[1280px] scroll-mt-20 px-6 pb-10">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-foreground">
              Every tool you need
            </h2>
            <p className="mt-2 max-w-md text-[14px] text-muted-foreground">
              From merging to OCR — pick a tool, drop your file, done.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-[12px] text-muted-foreground sm:flex">
            <Zap className="h-3.5 w-3.5" />
            <span>Instant. No queue.</span>
          </div>
        </div>
        <ToolGrid />
      </section>

      {/* Privacy section */}
      <section id="privacy" className="mx-auto mt-24 max-w-[1280px] scroll-mt-20 px-6">
        <div className="rounded-3xl border border-border bg-surface/60 p-10 sm:p-14">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[12px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                Privacy by design
              </div>
              <h2 className="mt-4 font-display text-[32px] font-semibold tracking-[-0.02em] text-foreground">
                Your files stay yours.
              </h2>
              <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
                Most tools run entirely in your browser using <code className="rounded bg-background px-1.5 py-0.5 text-[12.5px]">pdf-lib</code>.
                Nothing uploads. Nothing stored. Nothing logged.
              </p>
            </div>
            <div className="grid gap-3">
              <Bullet>No account, no email, no tracking pixels.</Bullet>
              <Bullet>Files processed client-side wherever possible.</Bullet>
              <Bullet>Any server-side processing is deleted within minutes.</Bullet>
              <Bullet>Source code is public — verify it yourself.</Bullet>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function TrustItem({ icon: Icon, title, body }: { icon: typeof ShieldCheck; title: string; body: string }) {
  return (
    <div className="bg-background p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface">
          <Icon className="h-3.5 w-3.5 text-foreground" strokeWidth={2.2} />
        </div>
        <div className="text-[13.5px] font-medium text-foreground">{title}</div>
      </div>
      <div className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{body}</div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-[13.5px] text-foreground">
      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}
