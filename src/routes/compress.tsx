import { createFileRoute } from "@tanstack/react-router";
import { ToolLayout } from "@/components/ToolLayout";
import { CompressTool } from "@/components/CompressTool";
import { toolsBySlug } from "@/lib/tools";

const tool = toolsBySlug["compress"];

export const Route = createFileRoute("/compress")({
  head: () => ({
    meta: [
      { title: `${tool.name} - Docshift` },
      { name: "description", content: tool.longDescription },
      { property: "og:title", content: `${tool.name} - Docshift` },
      { property: "og:description", content: tool.longDescription },
    ],
  }),
  component: () => <ToolLayout tool={tool} renderTool={() => <CompressTool tool={tool} />} />,
});
