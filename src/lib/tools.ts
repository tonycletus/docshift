import {
  Combine,
  Scissors,
  Minimize2,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  FileImage,
  FileType,
  ScanText,
  Lock,
  Unlock,
  Droplets,
  Hash,
  FileOutput,
  Trash2,
  RotateCw,
  ArrowUpDown,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory = "organize" | "convert" | "edit" | "security";
export type OutputType = "pdf" | "zip" | "docx" | "xlsx" | "pptx" | "jpg";

export interface ToolConfigOption {
  key: string;
  label: string;
  type: "number" | "text" | "select" | "password";
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string | number;
}

export interface Tool {
  slug: string;
  route: string;
  name: string;
  description: string;
  longDescription: string;
  icon: LucideIcon;
  category: ToolCategory;
  accept: Record<string, string[]>;
  multiple: boolean;
  configOptions?: ToolConfigOption[];
  outputType: OutputType;
  /** Whether processing can run fully in-browser (pdf-lib supported) */
  clientCapable: boolean;
}

const PDF_ACCEPT = { "application/pdf": [".pdf"] };
const IMG_ACCEPT = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] };
const DOC_ACCEPT = {
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

export const tools: Tool[] = [
  {
    slug: "merge",
    route: "/merge",
    name: "Merge PDF",
    description: "Combine multiple PDFs into one document.",
    longDescription: "Drop PDFs in the order you want them combined. We'll stitch them into a single file instantly, right in your browser.",
    icon: Combine,
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
    description: "Extract pages or split into multiple files.",
    longDescription: "Break a PDF into separate documents by page range or extract individual pages.",
    icon: Scissors,
    category: "organize",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      { key: "ranges", label: "Page ranges (e.g. 1-3, 5, 7-9)", type: "text", placeholder: "1-3, 5", defaultValue: "" },
    ],
    outputType: "zip",
    clientCapable: true,
  },
  {
    slug: "compress",
    route: "/compress",
    name: "Compress PDF",
    description: "Reduce file size while keeping quality.",
    longDescription: "Shrink large PDFs for easier sharing without sacrificing readability.",
    icon: Minimize2,
    category: "organize",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      {
        key: "level",
        label: "Compression level",
        type: "select",
        options: [
          { value: "low", label: "Low — best quality" },
          { value: "medium", label: "Medium — balanced" },
          { value: "high", label: "High — smallest size" },
        ],
        defaultValue: "medium",
      },
    ],
    outputType: "pdf",
    clientCapable: false,
  },
  {
    slug: "pdf-to-word",
    route: "/pdf-to-word",
    name: "PDF to Word",
    description: "Convert PDF to editable .docx.",
    longDescription: "Turn any PDF into a fully editable Word document while preserving layout.",
    icon: FileText,
    category: "convert",
    accept: PDF_ACCEPT,
    multiple: false,
    outputType: "docx",
    clientCapable: false,
  },
  {
    slug: "pdf-to-excel",
    route: "/pdf-to-excel",
    name: "PDF to Excel",
    description: "Pull tables into clean spreadsheets.",
    longDescription: "Detect tables in your PDFs and export them as ready-to-use Excel files.",
    icon: FileSpreadsheet,
    category: "convert",
    accept: PDF_ACCEPT,
    multiple: false,
    outputType: "xlsx",
    clientCapable: false,
  },
  {
    slug: "pdf-to-powerpoint",
    route: "/pdf-to-powerpoint",
    name: "PDF to PowerPoint",
    description: "Each PDF page becomes a slide.",
    longDescription: "Convert PDFs into editable PowerPoint presentations in seconds.",
    icon: Presentation,
    category: "convert",
    accept: PDF_ACCEPT,
    multiple: false,
    outputType: "pptx",
    clientCapable: false,
  },
  {
    slug: "pdf-to-jpg",
    route: "/pdf-to-jpg",
    name: "PDF to JPG",
    description: "Export each page as an image.",
    longDescription: "Render every page of your PDF as a high-resolution JPG image.",
    icon: ImageIcon,
    category: "convert",
    accept: PDF_ACCEPT,
    multiple: false,
    outputType: "zip",
    clientCapable: false,
  },
  {
    slug: "jpg-to-pdf",
    route: "/jpg-to-pdf",
    name: "JPG to PDF",
    description: "Bundle images into a single PDF.",
    longDescription: "Combine multiple JPG or PNG images into one neatly ordered PDF document.",
    icon: FileImage,
    category: "convert",
    accept: IMG_ACCEPT,
    multiple: true,
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "word-to-pdf",
    route: "/word-to-pdf",
    name: "Word to PDF",
    description: "Convert .doc and .docx files.",
    longDescription: "Turn Word documents into professional PDFs with formatting preserved.",
    icon: FileType,
    category: "convert",
    accept: DOC_ACCEPT,
    multiple: false,
    outputType: "pdf",
    clientCapable: false,
  },
  {
    slug: "ocr",
    route: "/ocr",
    name: "OCR PDF",
    description: "Make scanned PDFs searchable.",
    longDescription: "Extract text from scanned documents and make them searchable and selectable.",
    icon: ScanText,
    category: "edit",
    accept: PDF_ACCEPT,
    multiple: false,
    outputType: "pdf",
    clientCapable: false,
  },
  {
    slug: "protect",
    route: "/protect",
    name: "Protect PDF",
    description: "Encrypt with a password.",
    longDescription: "Add a password to keep your PDF private. AES-256 strength encryption.",
    icon: Lock,
    category: "security",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      { key: "password", label: "Password", type: "password", placeholder: "Enter a strong password" },
    ],
    outputType: "pdf",
    clientCapable: false,
  },
  {
    slug: "unlock",
    route: "/unlock",
    name: "Unlock PDF",
    description: "Remove password protection.",
    longDescription: "Strip the password from a PDF you own so it opens freely.",
    icon: Unlock,
    category: "security",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      { key: "password", label: "Current password", type: "password", placeholder: "Current password" },
    ],
    outputType: "pdf",
    clientCapable: false,
  },
  {
    slug: "watermark",
    route: "/watermark",
    name: "Add Watermark",
    description: "Stamp text on every page.",
    longDescription: "Add a custom text watermark — visible on every page, fully customizable.",
    icon: Droplets,
    category: "edit",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      { key: "text", label: "Watermark text", type: "text", placeholder: "CONFIDENTIAL", defaultValue: "CONFIDENTIAL" },
    ],
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "page-numbers",
    route: "/page-numbers",
    name: "Add Page Numbers",
    description: "Number every page automatically.",
    longDescription: "Insert clean, customizable page numbers in any corner of your document.",
    icon: Hash,
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
    icon: FileOutput,
    category: "organize",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      { key: "ranges", label: "Pages to extract", type: "text", placeholder: "1, 3-5", defaultValue: "" },
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
    icon: Trash2,
    category: "organize",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      { key: "ranges", label: "Pages to delete", type: "text", placeholder: "2, 4-6", defaultValue: "" },
    ],
    outputType: "pdf",
    clientCapable: true,
  },
  {
    slug: "rotate",
    route: "/rotate",
    name: "Rotate Pages",
    description: "Rotate 90°, 180°, or 270°.",
    longDescription: "Fix the orientation of all pages in your document with a single click.",
    icon: RotateCw,
    category: "edit",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      {
        key: "angle",
        label: "Rotation",
        type: "select",
        options: [
          { value: "90", label: "90° clockwise" },
          { value: "180", label: "180°" },
          { value: "270", label: "270° clockwise" },
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
    description: "Rearrange pages into a new order.",
    longDescription: "Specify a new page order and we'll rebuild the PDF to match.",
    icon: ArrowUpDown,
    category: "organize",
    accept: PDF_ACCEPT,
    multiple: false,
    configOptions: [
      { key: "order", label: "New order (e.g. 3,1,2,4)", type: "text", placeholder: "3,1,2,4", defaultValue: "" },
    ],
    outputType: "pdf",
    clientCapable: true,
  },
];

export const toolsBySlug = Object.fromEntries(tools.map((t) => [t.slug, t]));

export const categoryLabels: Record<ToolCategory, string> = {
  organize: "Organize",
  convert: "Convert",
  edit: "Edit",
  security: "Security",
};
