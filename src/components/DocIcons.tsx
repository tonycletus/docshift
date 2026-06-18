import type { ReactElement, SVGProps } from "react";

export type DocIcon = (props: SVGProps<SVGSVGElement>) => ReactElement;

const base = {
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Icon(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden="true" {...base} {...props} />;
}

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 3.5h7.5L19 8v12.5H7z" />
      <path d="M14.5 3.5V8H19" />
      <path d="M10 12h6" />
      <path d="M10 15h5" />
      <path d="M10 18h3" />
    </Icon>
  );
}

export function MergeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 5h6v6H5z" />
      <path d="M13 13h6v6h-6z" />
      <path d="M11 8h3.5A2.5 2.5 0 0 1 17 10.5V13" />
      <path d="M13 16H9.5A2.5 2.5 0 0 1 7 13.5V11" />
    </Icon>
  );
}

export function SplitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3v18" />
      <path d="M6 5h4v14H6z" />
      <path d="M14 5h4v14h-4z" />
      <path d="M9.5 12h5" />
    </Icon>
  );
}

export function CompressIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 4h12v16H6z" />
      <path d="M9 9h6" />
      <path d="M9 15h6" />
      <path d="M8 12h8" />
      <path d="M4 12h3" />
      <path d="M17 12h3" />
    </Icon>
  );
}

export function ExtractIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 4h9l3 3v13H7z" />
      <path d="M16 4v4h3" />
      <path d="M11 12h5" />
      <path d="M11 16h4" />
      <path d="M4 9v9a2 2 0 0 0 2 2h2" />
    </Icon>
  );
}

export function DeletePageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 5h10v15H7z" />
      <path d="M9 5l.8-2h4.4L15 5" />
      <path d="M5 5h14" />
      <path d="M10 10l4 4" />
      <path d="M14 10l-4 4" />
    </Icon>
  );
}

export function ReorderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 5h10" />
      <path d="M7 12h10" />
      <path d="M7 19h10" />
      <path d="M4 7l-2-2 2-2" />
      <path d="M20 17l2 2-2 2" />
    </Icon>
  );
}

export function WordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 4h12v16H6z" />
      <path d="M9 9l1.4 6 1.6-4 1.6 4L15 9" />
    </Icon>
  );
}

export function ExcelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 4h14v16H5z" />
      <path d="M5 9h14" />
      <path d="M5 14h14" />
      <path d="M10 4v16" />
      <path d="M15 4v16" />
    </Icon>
  );
}

export function SlidesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 6h14v10H5z" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
      <path d="M8 10h4" />
      <path d="M8 13h7" />
    </Icon>
  );
}

export function ImageFileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 4h12v16H6z" />
      <path d="M9 15l2.2-2.4 1.8 1.8 2-2.8 2 3.4" />
      <circle cx="10" cy="9" r="1.2" />
    </Icon>
  );
}

export function DocxToPdfIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 5h6v14H5z" />
      <path d="M13 5h6v14h-6z" />
      <path d="M7.5 10h1.8" />
      <path d="M7.5 13h1.8" />
      <path d="M15 10h2" />
      <path d="M15 13h1.5" />
    </Icon>
  );
}

export function TextExtractIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 5h12v14H6z" />
      <path d="M9 9h6" />
      <path d="M9 12h6" />
      <path d="M9 15h4" />
      <path d="M4 4l2 2" />
      <path d="M20 4l-2 2" />
    </Icon>
  );
}

export function LockDocIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 10V7a5 5 0 0 1 10 0v3" />
      <path d="M6 10h12v10H6z" />
      <path d="M12 14v2.5" />
    </Icon>
  );
}

export function UnlockDocIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M8 10V7a4 4 0 0 1 7.4-2" />
      <path d="M6 10h12v10H6z" />
      <path d="M12 14v2.5" />
    </Icon>
  );
}

export function WatermarkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 4h12v16H6z" />
      <path d="M8.5 15.5 15.5 8.5" />
      <path d="M9 10.5c1.5-1.5 4.5 1.5 6 0" />
      <path d="M9 14c1.5-1.5 4.5 1.5 6 0" />
    </Icon>
  );
}

export function PageNumberIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 4h10v16H7z" />
      <path d="M10 14h4" />
      <path d="M12 10v8" />
      <path d="M10 8h4" />
    </Icon>
  );
}

export function RotatePageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 5h9l2 2v12H7z" />
      <path d="M16 5v3h3" />
      <path d="M10 14a3 3 0 1 0 1-2.2" />
      <path d="M10 11v3H7" />
    </Icon>
  );
}

export function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3.5a8.5 8.5 0 0 0-2.7 16.6c.4.1.6-.2.6-.4v-1.6c-2.2.5-2.7-.9-2.7-.9-.4-.9-.9-1.1-.9-1.1-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-3.9 0-.9.3-1.6.8-2.2-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.5 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3-1.8 3.7-3.6 3.9.3.3.6.8.6 1.6v2.1c0 .2.2.5.6.4A8.5 8.5 0 0 0 12 3.5z" />
    </Icon>
  );
}

export function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7" />
      <path d="M9 7h8v8" />
    </Icon>
  );
}

export function BackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m15 6-6 6 6 6" />
    </Icon>
  );
}

export function LocalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 6h14v9H5z" />
      <path d="M9 19h6" />
      <path d="M12 15v4" />
      <path d="M8 10h8" />
    </Icon>
  );
}

export function NoAccountIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M5 5 19 19" />
    </Icon>
  );
}

export function OpenCodeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m9 8-4 4 4 4" />
      <path d="m15 8 4 4-4 4" />
      <path d="m13 6-2 12" />
    </Icon>
  );
}

export function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 16V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M5 15v4h14v-4" />
    </Icon>
  );
}

export function FileGlyphIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 4h8l3 3v13H7z" />
      <path d="M15 4v4h3" />
    </Icon>
  );
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 7l10 10" />
      <path d="M17 7 7 17" />
    </Icon>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m6.5 12.5 3.5 3.5 7.5-8" />
    </Icon>
  );
}

export function LoaderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3a9 9 0 0 1 9 9" />
      <path d="M12 21a9 9 0 0 1-9-9" />
    </Icon>
  );
}

export function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4 21 20H3z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 19h14" />
    </Icon>
  );
}

export function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M18 8a7 7 0 0 0-11.8-2.2L4 8" />
      <path d="M4 4v4h4" />
      <path d="M6 16a7 7 0 0 0 11.8 2.2L20 16" />
      <path d="M20 20v-4h-4" />
    </Icon>
  );
}

export function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3 19 6v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6z" />
      <path d="m8.5 12 2.3 2.3 4.8-5" />
    </Icon>
  );
}

export function SafeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3 18 6.5v5.2c0 3.7-2.3 6.5-6 8.3-3.7-1.8-6-4.6-6-8.3V6.5z" />
      <path d="M9 12h6" />
    </Icon>
  );
}

export function BalancedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 17h14" />
      <path d="M12 5v12" />
      <path d="M8 8h8" />
      <path d="M7 8l-3 6h6z" />
      <path d="M17 8l-3 6h6z" />
    </Icon>
  );
}

export function SmallerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 6h12v12H6z" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
      <path d="m4 12 2-2" />
      <path d="m4 12 2 2" />
      <path d="m20 12-2-2" />
      <path d="m20 12-2 2" />
    </Icon>
  );
}

export function GripIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 5h.01" />
      <path d="M15 5h.01" />
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
      <path d="M9 19h.01" />
      <path d="M15 19h.01" />
    </Icon>
  );
}

export function UpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m7 14 5-5 5 5" />
    </Icon>
  );
}

export function DownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m7 10 5 5 5-5" />
    </Icon>
  );
}
