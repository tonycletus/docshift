import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ToolGrid } from "@/components/ToolGrid";
import { ArrowIcon, LocalIcon, NoAccountIcon, OpenCodeIcon } from "@/components/DocIcons";
import { tools } from "@/lib/tools";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DocShift · Browser-based PDF toolkit" },
      {
        name: "description",
        content:
          "Merge, split, compress, convert, and protect PDFs directly in your browser. Files are processed locally on your device.",
      },
      { property: "og:title", content: "DocShift · Browser-based PDF toolkit" },
      {
        property: "og:description",
        content:
          "A complete PDF toolkit that runs locally in your browser.",
      },
      { property: "og:url", content: "https://docshift.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://docshift.lovable.app/" }],
  }),
  component: Index,
});

const ease = [0.22, 1, 0.36, 1] as const;

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-[1280px] px-6 pb-12 pt-12 sm:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
            className="mx-auto max-w-[760px] text-center"
          >
            <h1 className="font-display text-[40px] font-semibold leading-[1.02] tracking-[-0.02em] text-foreground sm:text-[56px]">
              Every PDF tool you need.
              <br />
              <span className="text-muted-foreground">Right in your browser.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-[540px] text-[15px] leading-relaxed text-muted-foreground">
              Merge, split, compress, convert, and protect PDFs in seconds. Your files never leave
              your device. No sign-ups, no limits, no nonsense.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                hash="tools"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-5 text-[13.5px] font-medium text-background transition-all hover:bg-foreground/90 active:scale-[0.99]"
              >
                Choose a tool
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease }}
            className="mx-auto mt-10 grid max-w-[760px] grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3"
          >
            <TrustItem
              icon={LocalIcon}
              title="Local runtime"
              body="Browser memory, not an upload queue."
            />
            <TrustItem
              icon={NoAccountIcon}
              title="No accounts"
              body="No sign-up step before your file."
            />
            <TrustItem icon={OpenCodeIcon} title="Open code" body="Static app, easy to inspect." />
          </motion.div>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-[1280px] scroll-mt-20 px-6 pb-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-foreground">
              Tools
            </h2>
            <p className="mt-1.5 max-w-md text-[13.5px] text-muted-foreground">
              Pick one action, drop the file, download the result.
            </p>
          </div>
          <div className="hidden font-mono text-[12px] text-muted-foreground sm:block">
            {tools.length} tools
          </div>
        </div>
        <ToolGrid />
      </section>

      <Footer />
    </div>
  );
}

function TrustItem({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof LocalIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-background p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface">
          <Icon className="h-3.5 w-3.5 text-foreground" />
        </div>
        <div className="text-[13.5px] font-medium text-foreground">{title}</div>
      </div>
      <div className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{body}</div>
    </div>
  );
}
