import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "@/components/ToolLayout";
import { ReorderTool } from "@/components/ReorderTool";
import { toolsBySlug } from "@/lib/tools";

const tool = toolsBySlug["reorder"];

export const Route = createFileRoute("/reorder")({
  head: () => ({
    meta: [
      { title: `${tool.name} · Docshift` },
      { name: "description", content: tool.longDescription },
      { property: "og:title", content: `${tool.name} · Docshift` },
      { property: "og:description", content: tool.longDescription },
    ],
  }),
  component: () => <ToolLayout tool={tool} renderTool={() => <ReorderTool tool={tool} />} />,
});
