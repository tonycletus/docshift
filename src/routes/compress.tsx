import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompressTool } from "@/components/CompressTool";
import { tools, toolsBySlug, categoryLabels } from "@/lib/tools";

const tool = toolsBySlug["compress"];

export const Route = createFileRoute("/compress")({
  head: () => ({
    meta: [
      { title: `${tool.name} — Docshift` },
      { name: "description", content: tool.longDescription },
      { property: "og:title", content: `${tool.name} — Docshift` },
      { property: "og:description", content: tool.longDescription },
    ],
  }),
  component: CompressPage,
});

function CompressPage() {
  const Icon = tool.icon;
  const related = tools.filter((t) => t.category === tool.category && t.slug !== tool.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All tools
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-8 max-w-[720px]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {categoryLabels[tool.category]}
            </div>
          </div>
          <h1 className="mt-5 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] text-foreground">
            {tool.name}
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-muted-foreground">
            {tool.longDescription}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 max-w-[720px]"
        >
          <CompressTool tool={tool} />
        </motion.div>

        {related.length > 0 && (
          <div className="mx-auto mt-20 max-w-[720px]">
            <div className="mb-4 font-display text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Related tools
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border">
              {related.map((r) => {
                const RIcon = r.icon;
                return (
                  <Link
                    key={r.slug}
                    to={r.route}
                    className="group flex items-center gap-3 bg-background p-4 transition-colors hover:bg-surface"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface group-hover:bg-foreground group-hover:text-background transition-colors">
                      <RIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-medium text-foreground">{r.name}</div>
                      <div className="truncate text-[12px] text-muted-foreground">{r.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
