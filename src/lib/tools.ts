import type { DocIcon } from "@/components/DocIcons";
import {
  CompressIcon,
  DeletePageIcon,
  DocxToPdfIcon,
  ExcelIcon,
  ExtractIcon,
  ImageFileIcon,
  LockDocIcon,
  MergeIcon,
  PageNumberIcon,
  ReorderIcon,
  RotatePageIcon,
  SlidesIcon,
  SplitIcon,
  TextExtractIcon,
  UnlockDocIcon,
  WatermarkIcon,
  WordIcon,
} from "@/components/DocIcons";

export type ToolCategory = "organize" | "convert" | "edit" | "security";
export type OutputType = "pdf" | "zip" | "docx" | "xlsx" | "pptx" | "jpg" | "txt" | "html";

export interface ToolConfigOption {
  key: string;
  label: string;
  type: "number" | "text" | "select" | "password" | "file";
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string | number;
  accept?: Record<string, string[]>;
  helperText?: string;
}

export interface Tool {
  slug: string;
  route: string;
  name: string;
  description: string;
  longDescription: string;
  icon: DocIcon;
  category: ToolCategory;
  accept: Record<string, string[]>;
  multiple: boolean;
  configOptions?: ToolConfigOption[];
  outputType: OutputType;
  clientCapable: boolean;
}

const PDF_ACCEPT = { "application/pdf": [".pdf"] };
const IMG_ACCEPT = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] };
const DOCX_ACCEPT = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

export const tools: Tool[] = [
  {
    slug: "merge",
    route: "/merge",
    name: "Merge PDF",
    description: "Combine multiple PDFs into one document.",
    longDescription:
      "Drop PDFs in the order you want them combined. We will stitch them into a single file in your browser.",
    icon: MergeIcon,
    category: "organize",
    accept: PDF_ACCEPT,
    multiple: true,
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "split",
    route: "/split",
    name: "Split PDF",
    description: "Extract ranges into separate PDFs.",
    longDescription:
      "Split a PDF into individual page files, or enter ranges to package selected sections into a ZIP.",
    icon: SplitIcon,
    category: "organize",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      {
        key: "ranges",
        label: "Page ranges",
        type: "text",
        placeholder: "1-3, 5",
        defaultValue: "",
      },
    ],
    outputType: "zip",
    clientCapable: true,
  },
  {
    slug: "compress",
    route: "/compress",
    name: "Compress PDF",
    description: "Safely reduce file size when possible.",
    longDescription:
      "Compress PDFs with quality-safe checks. Text stays sharp, and already optimized files are preserved instead of being made larger.",
    icon: CompressIcon,
    category: "organize",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      {
        key: "level",
        label: "Compression level",
        type: "select",
        options: [
          { value: "low", label: "Low - best quality" },
          { value: "medium", label: "Balanced - smart compression" },
          { value: "high", label: "Smaller - quality checked" },
        ],
        defaultValue: "medium",
      },
    ],
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "pdf-to-word",
    route: "/pdf-to-word",
    name: "PDF to Word",
    description: "Extract PDF text into editable .docx.",
    longDescription:
      "Create an editable Word document from selectable PDF text. Layout is simplified for clean editing.",
    icon: WordIcon,
    category: "convert",
    accept: PDF_ACCEPT,
    multiple: false,
    outputType: "docx",
    clientCapable: true,
  },
  {
    slug: "pdf-to-excel",
    route: "/pdf-to-excel",
    name: "PDF to Excel",
    description: "Move PDF text into spreadsheet rows.",
    longDescription:
      "Extract selectable PDF text into an Excel workbook, keeping page and row order where possible.",
    icon: ExcelIcon,
    category: "convert",
    accept: PDF_ACCEPT,
    multiple: false,
    outputType: "xlsx",
    clientCapable: true,
  },
  {
    slug: "pdf-to-powerpoint",
    route: "/pdf-to-powerpoint",
    name: "PDF to PowerPoint",
    description: "Turn each PDF page into a slide.",
    longDescription:
      "Render every PDF page into a PowerPoint slide deck that is ready to present or annotate.",
    icon: SlidesIcon,
    category: "convert",
    accept: PDF_ACCEPT,
    multiple: false,
    outputType: "pptx",
    clientCapable: true,
  },
  {
    slug: "pdf-to-jpg",
    route: "/pdf-to-jpg",
    name: "PDF to JPG",
    description: "Export each page as an image.",
    longDescription:
      "Render every page of your PDF as a high-resolution JPG image and download them as a ZIP.",
    icon: ImageFileIcon,
    category: "convert",
    accept: PDF_ACCEPT,
    multiple: false,
    outputType: "zip",
    clientCapable: true,
  },
  {
    slug: "jpg-to-pdf",
    route: "/jpg-to-pdf",
    name: "JPG to PDF",
    description: "Bundle images into a single PDF.",
    longDescription: "Combine multiple JPG or PNG images into one neatly ordered PDF document.",
    icon: ImageFileIcon,
    category: "convert",
    accept: IMG_ACCEPT,
    multiple: true,
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "word-to-pdf",
    route: "/word-to-pdf",
    name: "DOCX to PDF",
    description: "Convert Word text into a PDF.",
    longDescription: "Turn .docx document text into a clean PDF using local browser processing.",
    icon: DocxToPdfIcon,
    category: "convert",
    accept: DOCX_ACCEPT,
    multiple: false,
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "ocr",
    route: "/ocr",
    name: "Extract Text",
    description: "Save selectable PDF text as .txt.",
    longDescription:
      "Extract embedded selectable text from a PDF into a plain text file. Image-only scans may not contain extractable text.",
    icon: TextExtractIcon,
    category: "edit",
    accept: PDF_ACCEPT,
    multiple: false,
    outputType: "txt",
    clientCapable: true,
  },
  {
    slug: "protect",
    route: "/protect",
    name: "Protect PDF",
    description: "Require a password to open a PDF.",
    longDescription:
      "Encrypt your PDF locally so opening the downloaded PDF requires the password you set.",
    icon: LockDocIcon,
    category: "security",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      {
        key: "password",
        label: "Password",
        type: "password",
        placeholder: "Enter a strong password",
      },
    ],
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "unlock",
    route: "/unlock",
    name: "Unlock PDF",
    description: "Remove a PDF open password.",
    longDescription: "Use the current password to decrypt a protected PDF locally.",
    icon: UnlockDocIcon,
    category: "security",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      { key: "password", label: "PDF password", type: "password", placeholder: "PDF password" },
    ],
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "watermark",
    route: "/watermark",
    name: "Add Watermark",
    description: "Stamp text or an image on every page.",
    longDescription:
      "Add a styled text watermark or upload your own image watermark. If no image is uploaded, CONFIDENTIAL is used by default.",
    icon: WatermarkIcon,
    category: "edit",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      {
        key: "text",
        label: "Watermark text",
        type: "text",
        placeholder: "CONFIDENTIAL",
        defaultValue: "CONFIDENTIAL",
        helperText: "Used when no watermark image is uploaded.",
      },
      {
        key: "watermarkImage",
        label: "Watermark image",
        type: "file",
        accept: IMG_ACCEPT,
        helperText: "Optional JPG or PNG. It replaces the text watermark.",
      },
    ],
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "page-numbers",
    route: "/page-numbers",
    name: "Add Page Numbers",
    description: "Number every page automatically.",
    longDescription: "Insert clean page numbers in the selected corner of your document.",
    icon: PageNumberIcon,
    category: "edit",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      {
        key: "position",
        label: "Position",
        type: "select",
        options: [
          { value: "bottom-center", label: "Bottom center" },
          { value: "bottom-right", label: "Bottom right" },
          { value: "top-right", label: "Top right" },
        ],
        defaultValue: "bottom-center",
      },
    ],
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "extract-pages",
    route: "/extract-pages",
    name: "Extract Pages",
    description: "Pull specific pages into a new PDF.",
    longDescription: "Select pages by range and export them as a fresh PDF file.",
    icon: ExtractIcon,
    category: "organize",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      {
        key: "ranges",
        label: "Pages to extract",
        type: "text",
        placeholder: "1, 3-5",
        defaultValue: "",
      },
    ],
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "delete-pages",
    route: "/delete-pages",
    name: "Delete Pages",
    description: "Remove pages from a PDF.",
    longDescription: "Choose pages to remove and download the trimmed document.",
    icon: DeletePageIcon,
    category: "organize",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      {
        key: "ranges",
        label: "Pages to delete",
        type: "text",
        placeholder: "2, 4-6",
        defaultValue: "",
      },
    ],
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "rotate",
    route: "/rotate",
    name: "Rotate Pages",
    description: "Rotate 90, 180, or 270 degrees.",
    longDescription: "Fix the orientation of all pages in your document with a single click.",
    icon: RotatePageIcon,
    category: "edit",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      {
        key: "angle",
        label: "Rotation",
        type: "select",
        options: [
          { value: "90", label: "90 degrees clockwise" },
          { value: "180", label: "180 degrees" },
          { value: "270", label: "270 degrees clockwise" },
        ],
        defaultValue: "90",
      },
    ],
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "reorder",
    route: "/reorder",
    name: "Reorder Pages",
    description: "Drag PDF pages into a new order.",
    longDescription:
      "Preview every page, drag them into the order you want, and rebuild the PDF visually.",
    icon: ReorderIcon,
    category: "organize",
    accept: PDF_ACCEPT,
    multiple: false,
    outputType: "pdf",
    clientCapable: true,
  },
];

export const toolsBySlug = Object.fromEntries(tools.map((tool) => [tool.slug, tool]));

export const categoryLabels: Record<ToolCategory, string> = {
  organize: "Organize",
  convert: "Convert",
  edit: "Edit",
  security: "Security",
};
