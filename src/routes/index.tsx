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
      { title: "DocShift - Private PDF tools" },
      {
        name: "description",
        content: "Private PDF tools. Free, open source, and no uploads.",
      },
      { property: "og:title", content: "DocShift - Private PDF tools" },
      {
        property: "og:description",
        content: "Private PDF tools. Free, open source, and no uploads.",
      },
      { property: "og:url", content: "https://docshift.tonycletus.com/" },
    ],
    links: [{ rel: "canonical", href: "https://docshift.tonycletus.com/" }],
  }),
  component: Index,
});

const ease = [0.22, 1, 0.36, 1] as const;

const faqs: { q: string; a: string }[] = [
  {
    q: "How are my files processed?",
    a: "Everything runs on your device. Your PDFs are read, edited, and saved right where you opened them. They're never uploaded to a server.",
  },
  {
    q: "Where do my files go after I'm done?",
    a: "Nowhere. Since files never leave your device, closing the tab is all it takes to remove them. There's no copy to delete.",
  },
  {
    q: "Why is there no login or account?",
    a: "There's nothing to store. No files, no history, no usage to meter. An account would only add friction without giving you anything in return.",
  },
  {
    q: "Is DocShift really free?",
    a: "Yes. Every tool is free to use with no limits, watermarks, or paywalls. The project is open source and built in the open.",
  },
];

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
              Private PDF tools.
              <br />
              <span className="text-muted-foreground">No uploads.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-[540px] text-[15px] leading-relaxed text-muted-foreground">
              Free and open source for browser, desktop, and CLI.
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
              title="Local by design"
              body="Work in your browser, desktop app, or terminal."
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

      <section
        id="faq"
        aria-labelledby="faq-heading"
        className="mx-auto max-w-[1280px] scroll-mt-20 px-6 pb-16 pt-8"
      >
        <div className="mb-6">
          <h2
            id="faq-heading"
            className="font-display text-[24px] font-semibold tracking-[-0.02em] text-foreground"
          >
            FAQ
          </h2>
          <p className="mt-1.5 text-[13.5px] text-muted-foreground">
            Short answers to the questions I get most.
          </p>
        </div>
        <dl
          role="list"
          className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2"
        >
          {faqs.map((f) => (
            <div key={f.q} role="listitem" className="bg-background p-5">
              <dt>
                <h3 className="text-[13.5px] font-medium text-foreground">{f.q}</h3>
              </dt>
              <dd className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
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
