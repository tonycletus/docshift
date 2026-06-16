import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "@/components/ToolLayout";
import { toolsBySlug } from "@/lib/tools";

const tool = toolsBySlug["protect"];

export const Route = createFileRoute("/protect")({
  head: () => ({
    meta: [
      { title: `${tool.name} — PDFly` },
      { name: "description", content: tool.longDescription },
      { property: "og:title", content: `${tool.name} — PDFly` },
      { property: "og:description", content: tool.longDescription },
    ],
  }),
  component: () => <ToolLayout tool={tool} />,
});
