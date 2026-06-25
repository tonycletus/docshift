import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "@/components/ToolLayout";
import { toolsBySlug } from "@/lib/tools";

const tool = toolsBySlug["prepare-form"];

export const Route = createFileRoute("/prepare-form")({
  head: () => ({
    meta: [
      { title: `${tool.name} - Docshift` },
      { name: "description", content: tool.longDescription },
      { property: "og:title", content: `${tool.name} - Docshift` },
      { property: "og:description", content: tool.longDescription },
    ],
  }),
  component: () => <ToolLayout tool={tool} />,
});
