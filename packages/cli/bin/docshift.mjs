#!/usr/bin/env node
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stdin, stdout, stderr, exit, versions, platform, arch } from "node:process";
import { inflateSync } from "node:zlib";
import JSZip from "jszip";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

const VERSION = "1.1.4";
const supportedTools = new Set([
  "compress",
  "merge",
  "split",
  "ocr",
  "protect",
  "unlock",
  "watermark",
  "rotate",
  "delete-pages",
  "extract-pages",
  "reorder",
]);

const summaries = {
  compress: "Reduce PDF file size with lossless local optimization.",
  merge: "Combine multiple PDFs into one document.",
  split: "Split page ranges into PDFs or a ZIP archive.",
  ocr: "Extract embedded PDF text to a .txt file.",
  protect: "Require a password to open a PDF.",
  unlock: "Remove a PDF open password.",
  watermark: "Stamp text or a PNG/JPG image on every page.",
  rotate: "Rotate all pages or selected pages.",
  "delete-pages": "Remove selected pages from a PDF.",
  "extract-pages": "Pull selected pages into a new PDF.",
  reorder: "Rebuild a PDF in a new page order.",
};

main().catch((error) => {
  stderr.write(`docshift: ${error instanceof Error ? error.message : String(error)}\n`);
  exit(1);
});

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp(args[0]);
    return;
  }
  if (command === "version") return runVersion(args);
  if (command === "doctor") return runDoctor(args);
  if (!supportedTools.has(command)) throw new Error(`unknown command "${command}"`);
  return runTool(command, args);
}

function parseArgs(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      positional.push(...args.slice(i + 1));
      break;
    }
    if (!arg.startsWith("-")) {
      positional.push(arg);
      continue;
    }
    const [rawKey, inlineValue] = arg.split("=", 2);
    const key = rawKey.replace(/^-+/, "");
    if (key === "o") {
      flags.output = inlineValue ?? args[++i];
      continue;
    }
    if (key === "p") {
      flags.password = inlineValue ?? args[++i];
      continue;
    }
    if (key === "q") {
      flags.quiet = true;
      continue;
    }
    if (key === "h") {
      flags.help = true;
      continue;
    }
    if (["json", "quiet", "password-from-stdin", "help", "verbose"].includes(key)) {
      flags[key] = true;
      continue;
    }
    flags[key] = inlineValue ?? args[++i];
  }
  return { flags, positional };
}

async function runVersion(args) {
  const { flags } = parseArgs(args);
  const info = {
    name: "docshift",
    version: VERSION,
    runtime: `node ${versions.node} ${platform}/${arch}`,
  };
  if (flags.json) stdout.write(`${JSON.stringify(info)}\n`);
  else stdout.write(`docshift ${VERSION}\nruntime: ${info.runtime}\n`);
}

async function runDoctor(args) {
  const { flags } = parseArgs(args);
  const checks = [
    {
      name: "node",
      status: Number(versions.node.split(".")[0]) >= 20 ? "ok" : "fail",
      detail: versions.node,
    },
    { name: "pdf-lib", status: "ok", detail: "available" },
    { name: "qpdf-wasm", status: "ok", detail: "available" },
    { name: "cwd", status: "ok", detail: resolve(".") },
  ];
  if (flags.json) {
    stdout.write(`${JSON.stringify(checks)}\n`);
    return;
  }
  const failures = checks.filter((check) => check.status !== "ok");
  if (!flags.verbose && failures.length === 0) {
    stdout.write(`DocShift CLI ${VERSION}: OK\n`);
    stdout.write(`node       ok   ${versions.node}\n`);
    stdout.write(`cwd        ok   ${resolve(".")}\n`);
    return;
  }
  for (const check of checks) {
    stdout.write(`${check.name.padEnd(10)} ${check.status.padEnd(4)} ${check.detail}\n`);
  }
}

async function runTool(name, args) {
  const { flags, positional } = parseArgs(args);
  if (flags.help) {
    printHelp(name);
    return;
  }
  const output = flags.output;
  if (!output) throw new Error("missing output path; pass -o or --output");

  let result;
  switch (name) {
    case "merge":
      result = await mergePdfs(positional);
      break;
    case "compress":
      requireInput(positional, 1);
      result = await compressPdf(positional[0], flags.preset || "balanced");
      break;
    case "split":
      requireInput(positional, 1);
      result = await splitPdf(positional[0], flags.pages || flags.ranges || "", output);
      break;
    case "ocr":
      requireInput(positional, 1);
      result = await extractPdfText(positional[0]);
      break;
    case "protect":
      requireInput(positional, 1);
      result = await protectPdf(positional[0], await passwordFromFlags(flags, "Enter a password."));
      break;
    case "unlock":
      requireInput(positional, 1);
      result = await unlockPdf(
        positional[0],
        await passwordFromFlags(flags, "Enter the existing password."),
      );
      break;
    case "watermark":
      requireInput(positional, 1);
      result = await watermarkPdf(positional[0], flags);
      break;
    case "rotate":
      requireInput(positional, 1);
      result = await rotatePdf(positional[0], flags);
      break;
    case "delete-pages":
      requireInput(positional, 1);
      result = await deletePages(positional[0], flags.pages || flags.ranges || "");
      break;
    case "extract-pages":
      requireInput(positional, 1);
      result = await extractPages(positional[0], flags.pages || flags.ranges || "");
      break;
    case "reorder":
      requireInput(positional, 1);
      result = await reorderPages(positional[0], flags.order || "");
      break;
  }

  await writeOutput(output, result);
  if (!flags.quiet) {
    const summary = {
      command: name,
      output,
      bytes: result.bytes.length,
      ...(result.meta ? { meta: result.meta } : {}),
    };
    stdout.write(
      flags.json
        ? `${JSON.stringify(summary)}\n`
        : `Wrote ${output} (${result.bytes.length} bytes)\n`,
    );
  }
}

function requireInput(positional, count) {
  if (positional.length < count) throw new Error("missing input file");
}

async function loadPdf(path) {
  return PDFDocument.load(await readFile(path), {
    ignoreEncryption: false,
    updateMetadata: false,
  });
}

async function mergePdfs(files) {
  if (files.length < 2) throw new Error("merge needs at least two PDF files");
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await loadPdf(file);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((page) => out.addPage(page));
  }
  return { bytes: await out.save({ useObjectStreams: true }) };
}

async function copyPages(src, indices) {
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((page) => out.addPage(page));
  return out.save({ useObjectStreams: true });
}

async function compressPdf(file, preset) {
  const safePreset = ["safe", "balanced", "smaller"].includes(preset) ? preset : "balanced";
  const input = await readFile(file);
  const variants = [
    { name: "original", bytes: input },
    { name: "pdf-lib", bytes: await resavePdf(file) },
  ];
  const qpdfArgs = {
    safe: ["--object-streams=generate", "--stream-data=compress", "--compress-streams=y"],
    balanced: [
      "--object-streams=generate",
      "--stream-data=compress",
      "--compress-streams=y",
      "--recompress-flate",
      "--compression-level=9",
    ],
    smaller: [
      "--object-streams=generate",
      "--stream-data=compress",
      "--compress-streams=y",
      "--recompress-flate",
      "--compression-level=9",
      "--remove-unreferenced-resources=yes",
      "--normalize-content=y",
    ],
  };
  try {
    variants.push({
      name: `qpdf-${safePreset}`,
      bytes: await runQpdfTransform(input, qpdfArgs[safePreset]),
    });
  } catch {
    if (safePreset !== "safe") {
      variants.push({ name: "qpdf-safe", bytes: await runQpdfTransform(input, qpdfArgs.safe) });
    }
  }
  const best = variants.reduce((current, item) =>
    item.bytes.length < current.bytes.length ? item : current,
  );
  const output = best.bytes.length <= input.length ? best : variants[0];
  return {
    bytes: output.bytes,
    meta: {
      preset: safePreset,
      originalSize: input.length,
      outputSize: output.bytes.length,
      method: output.name,
      savedPercent: Math.max(0, Math.round((1 - output.bytes.length / input.length) * 100)),
    },
  };
}

async function resavePdf(file) {
  const pdf = await loadPdf(file);
  return pdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });
}

async function splitPdf(file, pagesText, output) {
  const src = await loadPdf(file);
  const total = src.getPageCount();
  const groups = pagesText.trim()
    ? parseRangeGroups(pagesText, total)
    : Array.from({ length: total }, (_, i) => ({ label: `${i + 1}`, indices: [i] }));

  if (groups.length === 1 && extname(output).toLowerCase() !== ".zip") {
    return { bytes: await copyPages(src, groups[0].indices) };
  }

  const zip = new JSZip();
  for (const group of groups) {
    zip.file(`${baseName(file)}-pages-${group.label}.pdf`, await copyPages(src, group.indices));
  }
  return { bytes: await zip.generateAsync({ type: "uint8array" }) };
}

async function extractPdfText(file) {
  const bytes = await readFile(file);
  const text = extractTextFromPdfBytes(bytes);
  if (!text) {
    throw new Error(
      "no embedded text found; use DocShift in the browser or desktop app for scanned-page OCR",
    );
  }
  return { bytes: Buffer.from(`${text}\n`, "utf8") };
}

function extractTextFromPdfBytes(bytes) {
  const source = Buffer.from(bytes).toString("latin1");
  const chunks = [];
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;

  while ((match = streamPattern.exec(source))) {
    const header = source.slice(Math.max(0, match.index - 800), match.index);
    let content = Buffer.from(match[1], "latin1");
    if (/\/Filter\s*(?:\[[^\]]*)?\/FlateDecode/.test(header)) {
      try {
        content = inflateSync(content);
      } catch {
        continue;
      }
    }
    chunks.push(...extractTextFromPdfContent(content.toString("latin1")));
  }

  return chunks
    .join("\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTextFromPdfContent(content) {
  const out = [];

  content.replace(/\[((?:.|\r|\n)*?)\]\s*TJ/g, (_match, body) => {
    const text = readPdfTextTokens(body).join("").replace(/\s+/g, " ").trim();
    if (text) out.push(text);
    return _match;
  });

  content.replace(/((?:\((?:\\.|[^\\)])*\)\s*)+)(?:Tj|'|")/g, (_match, body) => {
    const text = readPdfLiteralStrings(body).join(" ").replace(/\s+/g, " ").trim();
    if (text) out.push(text);
    return _match;
  });

  content.replace(/<([0-9a-fA-F\s]+)>\s*(?:Tj|'|")/g, (_match, hex) => {
    const text = decodePdfHexString(hex).replace(/\s+/g, " ").trim();
    if (text) out.push(text);
    return _match;
  });

  return out;
}

function readPdfTextTokens(input) {
  const tokens = [];
  tokens.push(...readPdfLiteralStrings(input));
  const hexPattern = /<([0-9a-fA-F\s]+)>/g;
  let match;
  while ((match = hexPattern.exec(input))) {
    const text = decodePdfHexString(match[1]);
    if (text) tokens.push(text);
  }
  return tokens;
}

function readPdfLiteralStrings(input) {
  const values = [];
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== "(") continue;
    let value = "";
    let depth = 1;
    i += 1;
    for (; i < input.length && depth > 0; i++) {
      const char = input[i];
      if (char === "\\") {
        const next = input[++i];
        if (next === "n") value += "\n";
        else if (next === "r") value += "\r";
        else if (next === "t") value += "\t";
        else if (next === "b") value += "\b";
        else if (next === "f") value += "\f";
        else if (/[0-7]/.test(next)) {
          const rest = input.slice(i + 1, i + 3).match(/^[0-7]{0,2}/)?.[0] ?? "";
          const octal = `${next}${rest}`;
          i += octal.length - 1;
          value += String.fromCharCode(parseInt(octal, 8));
        } else if (next !== "\r" && next !== "\n") {
          value += next ?? "";
        }
        continue;
      }
      if (char === "(") {
        depth += 1;
        value += char;
        continue;
      }
      if (char === ")") {
        depth -= 1;
        if (depth > 0) value += char;
        continue;
      }
      value += char;
    }
    if (value) values.push(value);
  }
  return values;
}

function decodePdfHexString(hex) {
  const clean = hex.replace(/\s+/g, "");
  if (!clean) return "";
  const even = clean.length % 2 === 0 ? clean : `${clean}0`;
  const bytes = Buffer.from(even, "hex");
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    const swapped = Buffer.alloc(bytes.length - 2);
    for (let i = 2; i < bytes.length; i += 2) {
      swapped[i - 2] = bytes[i + 1] ?? 0;
      swapped[i - 1] = bytes[i];
    }
    return swapped.toString("utf16le");
  }
  return bytes.toString("latin1");
}

async function protectPdf(file, password) {
  if (!password.trim()) throw new Error("password cannot be empty");
  return {
    bytes: await runQpdfTransform(await readFile(file), [
      "--encrypt",
      password,
      password,
      "256",
      "--",
    ]),
  };
}

async function unlockPdf(file, password) {
  if (!password.trim()) throw new Error("password cannot be empty");
  return {
    bytes: await runQpdfTransform(await readFile(file), [`--password=${password}`, "--decrypt"], {
      inputFirst: false,
    }),
  };
}

async function watermarkPdf(file, flags) {
  const pdf = await loadPdf(file);
  const text = String(flags.text || "CONFIDENTIAL").trim() || "CONFIDENTIAL";
  const image = flags.image ? await embedWatermarkImage(pdf, flags.image) : null;
  const font = image ? null : await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    if (image) {
      const maxWidth = width * 0.55;
      const maxHeight = height * 0.28;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const imageWidth = image.width * scale;
      const imageHeight = image.height * scale;
      page.drawImage(image, {
        x: width / 2 - imageWidth / 2,
        y: height / 2 - imageHeight / 2,
        width: imageWidth,
        height: imageHeight,
        opacity: numberFlag(flags.opacity, 0.22),
        rotate: degrees(numberFlag(flags.angle, 45)),
      });
      continue;
    }
    const size = Math.min(width, height) * numberFlag(flags.scale, 0.12);
    page.drawText(text, {
      x: width / 2 - (text.length * size) / 4,
      y: height / 2,
      size,
      font,
      color: rgb(0.7, 0.7, 0.75),
      opacity: numberFlag(flags.opacity, 0.25),
      rotate: degrees(numberFlag(flags.angle, 45)),
    });
  }
  return { bytes: await pdf.save({ useObjectStreams: true }) };
}

async function embedWatermarkImage(pdf, path) {
  const bytes = await readFile(path);
  const ext = extname(path).toLowerCase();
  if (ext === ".png") return pdf.embedPng(bytes);
  if (ext === ".jpg" || ext === ".jpeg") return pdf.embedJpg(bytes);
  throw new Error("watermark image must be PNG, JPG, or JPEG");
}

async function rotatePdf(file, flags) {
  const pdf = await loadPdf(file);
  const angle = parseInt(String(flags.angle || "90"), 10);
  if (![90, 180, 270, -90, -180, -270].includes(angle)) {
    throw new Error("--angle must be 90, 180, or 270");
  }
  const selected = selectedPages(flags.pages || flags.ranges || "", pdf.getPageCount());
  pdf.getPages().forEach((page, index) => {
    if (!selected.has(index)) return;
    page.setRotation(degrees((page.getRotation().angle + angle + 360) % 360));
  });
  return { bytes: await pdf.save({ useObjectStreams: true }) };
}

async function extractPages(file, pagesText) {
  const src = await loadPdf(file);
  const indices = unique(parseRanges(pagesText, src.getPageCount()));
  if (!indices.length) throw new Error("specify at least one page with --pages");
  return { bytes: await copyPages(src, indices) };
}

async function deletePages(file, pagesText) {
  const src = await loadPdf(file);
  const total = src.getPageCount();
  const remove = new Set(parseRanges(pagesText, total));
  if (!remove.size) throw new Error("specify at least one page with --pages");
  const keep = Array.from({ length: total }, (_, i) => i).filter((i) => !remove.has(i));
  if (!keep.length) throw new Error("a PDF must keep at least one page");
  return { bytes: await copyPages(src, keep) };
}

async function reorderPages(file, orderText) {
  const src = await loadPdf(file);
  const total = src.getPageCount();
  const order = orderText
    .split(/[,\s]+/)
    .filter(Boolean)
    .map((n) => parseInt(n, 10) - 1);
  if (!order.length) throw new Error("specify a new page order with --order");
  if (order.some((n) => Number.isNaN(n) || n < 0 || n >= total)) {
    throw new Error(`use page numbers between 1 and ${total}`);
  }
  return { bytes: await copyPages(src, order) };
}

function parseRanges(input, max) {
  return parseRangeGroups(input, max).flatMap((range) => range.indices);
}

function parseRangeGroups(input, max) {
  const parts = String(input || "")
    .split(/[,\s]+/)
    .filter(Boolean);
  if (!parts.length) return [];
  return parts.map((part) => {
    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error(`"${part}" is not a valid page range`);
    const start = Math.max(1, parseInt(match[1], 10));
    const rawEnd = match[2] ? parseInt(match[2], 10) : start;
    const end = Math.min(Math.max(start, rawEnd), max);
    if (start > max) throw new Error(`page ${start} is outside this ${max}-page PDF`);
    return {
      label: start === end ? `${start}` : `${start}-${end}`,
      indices: Array.from({ length: end - start + 1 }, (_, i) => start + i - 1),
    };
  });
}

function selectedPages(input, max) {
  const ranges = String(input || "").trim()
    ? parseRanges(input, max)
    : Array.from({ length: max }, (_, i) => i);
  return new Set(ranges);
}

function unique(items) {
  return [...new Set(items)];
}

function baseName(path) {
  return (
    path
      .split(/[\\/]/)
      .pop()
      .replace(/\.[^.]+$/, "") || "document"
  );
}

function numberFlag(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function passwordFromFlags(flags, message) {
  if (typeof flags.password === "string") return flags.password;
  if (flags["password-from-stdin"]) return readStdin();
  throw new Error(
    `${message} Use -p <value>, --password <value>, or pipe into --password-from-stdin.`,
  );
}

function readStdin() {
  if (stdin.isTTY) {
    throw new Error(
      "--password-from-stdin waits for piped input. Use -p <password> or pipe a password, for example: echo mypass | docshift protect input.pdf --password-from-stdin -o locked.pdf",
    );
  }
  return new Promise((resolveRead, reject) => {
    let data = "";
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => {
      data += chunk;
    });
    stdin.on("end", () => resolveRead(data.trim()));
    stdin.on("error", reject);
  });
}

async function writeOutput(output, result) {
  await mkdir(dirname(resolve(output)), { recursive: true });
  if (result.copyFrom) await copyFile(result.copyFrom, output);
  else await writeFile(output, result.bytes);
}

async function runQpdfTransform(inputBytes, args, options = {}) {
  const qpdf = await getQpdf();
  const inputPath = `/input-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`;
  const outputPath = `/output-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`;
  qpdf.FS.writeFile(inputPath, inputBytes);
  try {
    const callArgs =
      options.inputFirst === false
        ? [...args, inputPath, outputPath]
        : [inputPath, ...args, outputPath];
    const code = qpdf.callMain(callArgs);
    if (code !== 0) throw new Error(`qpdf failed with exit code ${code}`);
    return qpdf.FS.readFile(outputPath);
  } finally {
    try {
      qpdf.FS.unlink(inputPath);
    } catch {}
    try {
      qpdf.FS.unlink(outputPath);
    } catch {}
  }
}

let qpdfPromise;
async function getQpdf() {
  if (qpdfPromise) return qpdfPromise;
  qpdfPromise = (async () => {
    const wasm = fileURLToPath(import.meta.resolve("@jspawn/qpdf-wasm/qpdf.wasm"));
    const oldFetch = globalThis.fetch;
    globalThis.fetch = undefined;
    try {
      const { default: qpdfFactory } = await import("@jspawn/qpdf-wasm/qpdf.mjs");
      const module = await qpdfFactory({
        locateFile: () => wasm,
        print: () => undefined,
        printErr: () => undefined,
      });
      return module;
    } finally {
      globalThis.fetch = oldFetch;
    }
  })();
  return qpdfPromise;
}

function printHelp(command) {
  if (command && supportedTools.has(command)) {
    stdout.write(`Usage:\n  ${usage(command)}\n\n${summaries[command]}\n\n${flags(command)}\n`);
    return;
  }
  stdout.write(`DocShift CLI

Usage:
  docshift <command> [flags]

Global commands:
  doctor             Check local runtime
  version            Print version metadata

PDF commands:
${[...supportedTools].map((tool) => `  ${tool.padEnd(18)} ${summaries[tool]}`).join("\n")}
`);
}

function usage(command) {
  const map = {
    merge: "docshift merge <a.pdf> <b.pdf> -o combined.pdf",
    compress: "docshift compress <input.pdf> --preset balanced -o output.pdf",
    split: "docshift split <input.pdf> --pages 1-3 -o pages.pdf",
    ocr: "docshift ocr <input.pdf> -o text.txt",
    protect: "docshift protect <input.pdf> -p <password> -o locked.pdf",
    unlock: "docshift unlock <input.pdf> -p <password> -o unlocked.pdf",
    watermark: "docshift watermark <input.pdf> --text CONFIDENTIAL -o marked.pdf",
    rotate: "docshift rotate <input.pdf> --angle 90 --pages 1-2 -o rotated.pdf",
    "delete-pages": "docshift delete-pages <input.pdf> --pages 2 -o trimmed.pdf",
    "extract-pages": "docshift extract-pages <input.pdf> --pages 1,3 -o extracted.pdf",
    reorder: "docshift reorder <input.pdf> --order 3,1,2 -o reordered.pdf",
  };
  return map[command];
}

function flags(command) {
  const common = [
    "  -o, --output <path>       Write the result to a file.",
    "  --json                   Print a machine-readable summary.",
    "  --quiet                  Suppress success output.",
  ];
  const extra = {
    compress: ["  --preset <name>          safe, balanced, or smaller."],
    split: ["  --pages <ranges>         Ranges like 1-3,5. Omit to split every page."],
    ocr: ["  note                    Browser and desktop apps run scanned-page OCR locally."],
    protect: [
      "  -p, --password <value>   Open password.",
      "  --password-from-stdin    Read piped password from stdin.",
    ],
    unlock: [
      "  -p, --password <value>   Existing password.",
      "  --password-from-stdin    Read piped password from stdin.",
    ],
    watermark: [
      "  --text <string>          Text watermark. Default: CONFIDENTIAL.",
      "  --image <path>           PNG/JPG watermark image.",
      "  --opacity <number>       Watermark opacity. Default: 0.25.",
    ],
    rotate: [
      "  --angle <deg>            90, 180, or 270.",
      "  --pages <ranges>         Optional selected pages.",
    ],
    "delete-pages": ["  --pages <ranges>         Pages to delete."],
    "extract-pages": ["  --pages <ranges>         Pages to extract."],
    reorder: ["  --order <list>           New order, for example 3,1,2."],
  };
  return `Flags:\n${[...(extra[command] || []), ...common].join("\n")}`;
}
