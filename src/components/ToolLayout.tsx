import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BackIcon } from "@/components/DocIcons";
import type { Tool } from "@/lib/tools";
import { Header } from "./Header";
import { UploadZone } from "./UploadZone";
import { categoryLabels } from "@/lib/tools";

interface Props {
  tool: Tool;
  renderTool?: () => ReactNode;
}

export function ToolLayout({ tool, renderTool }: Props) {
  const Icon = tool.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1280px] px-6 pb-10 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <BackIcon className="h-3.5 w-3.5" />
          All tools
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-5 max-w-[720px]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background">
              <Icon className="h-[18px] w-[18px]" />
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {categoryLabels[tool.category]}
            </div>
          </div>
          <h1 className="mt-4 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
            {tool.name}
          </h1>
          <p className="mt-2 max-w-[600px] text-[14px] leading-relaxed text-muted-foreground">
            {tool.longDescription}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-[720px]"
        >
          {renderTool ? renderTool() : <UploadZone tool={tool} />}
        </motion.div>
      </main>
    </div>
  );
}
