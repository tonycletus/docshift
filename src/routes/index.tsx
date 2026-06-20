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
      { title: "DocShift · A faster way to work with PDFs" },
      {
        name: "description",
        content:
          "Merge, split, compress, convert, and protect PDFs in seconds. Private by design, free to use.",
      },
      { property: "og:title", content: "DocShift · A faster way to work with PDFs" },
      {
        property: "og:description",
        content: "Every PDF tool you actually need, in one place. Private, fast, and free.",
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
              A faster way
              <br />
              <span className="text-muted-foreground">to work with PDFs.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-[540px] text-[15px] leading-relaxed text-muted-foreground">
              Every PDF tool you actually need, in one place. Merge, split, compress, convert, and
              protect, in seconds.
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
              title="Private by design"
              body="Your files are processed on your device, not on a server."
            />
            <TrustItem
              icon={NoAccountIcon}
              title="No account"
              body="Open a tool and get to work. No signup, no paywall."
            />
            <TrustItem
              icon={OpenCodeIcon}
              title="Open source"
              body="Built in the open. Inspect the code anytime."
            />
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
              Pick a tool, drop your file, get the result.
            </p>
          </div>
          <div className="hidden font-mono text-[12px] text-muted-foreground sm:block">
            {tools.length} tools
          </div>
        </div>
        <ToolGrid />
      </section>

      <section id="faq" className="mx-auto max-w-[1280px] scroll-mt-20 px-6 pb-16 pt-8">
        <div className="mb-6">
          <h2 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-foreground">
            FAQ
          </h2>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Short answers to the questions we get most.
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {faqs.map((f) => (
            <div key={f.q} className="bg-background p-5">
              <div className="text-[13.5px] font-medium text-foreground">{f.q}</div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
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
