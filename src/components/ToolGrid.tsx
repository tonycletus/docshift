import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { ArrowIcon } from "@/components/DocIcons";
import { tools, categoryLabels, type ToolCategory } from "@/lib/tools";

const categories: ToolCategory[] = ["organize", "convert", "edit", "security"];

export function ToolGrid() {
  return (
    <div className="space-y-14">
      {categories.map((cat) => (
        <section key={cat}>
          <div className="mb-5 flex items-baseline justify-between">
            <h3 className="font-display text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {categoryLabels[cat]}
            </h3>
            <span className="font-mono text-[11px] text-muted-foreground/70">
              {tools
                .filter((t) => t.category === cat)
                .length.toString()
                .padStart(2, "0")}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {tools
              .filter((t) => t.category === cat)
              .map((tool, i) => {
                const Icon = tool.icon;
                return (
                  <motion.div
                    key={tool.slug}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.25, delay: i * 0.02, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      to={tool.route}
                      className="group relative flex h-full flex-col gap-3 bg-background p-5 transition-colors hover:bg-surface"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground transition-all group-hover:bg-foreground group-hover:text-background">
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <ArrowIcon className="h-4 w-4 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                      </div>
                      <div>
                        <div className="font-display text-[15px] font-semibold tracking-tight text-foreground">
                          {tool.name}
                        </div>
                        <div className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                          {tool.description}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
