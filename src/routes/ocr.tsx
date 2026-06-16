import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "@/components/ToolLayout";
import { toolsBySlug } from "@/lib/tools";

const tool = toolsBySlug["ocr"];

export const Route = createFileRoute("/ocr")({
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
