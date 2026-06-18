import qpdfFactory from "@jspawn/qpdf-wasm/qpdf.js";
import qpdfWasmUrl from "@jspawn/qpdf-wasm/qpdf.wasm?url";

interface QpdfModule {
  callMain(args: string[]): number;
  FS: {
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string): Uint8Array;
    unlink(path: string): void;
  };
}

type QpdfOptions = {
  locateFile: (file: string) => string;
  print: (text: string) => void;
  printErr: (text: string) => void;
};

let modulePromise: Promise<QpdfModule> | null = null;

function getQpdfModule(): Promise<QpdfModule> {
  modulePromise ??= (qpdfFactory as (options: QpdfOptions) => Promise<QpdfModule>)({
    locateFile: (file: string) => {
      if (file.endsWith(".wasm")) return qpdfWasmUrl;
      return file;
    },
    print: () => undefined,
    printErr: () => undefined,
  });
  return modulePromise;
}

function runQpdf(module: QpdfModule, args: string[]): void {
  const code = module.callMain(args);
  if (code !== 0) throw new Error(`qpdf failed with exit code ${code}.`);
}

function cleanup(module: QpdfModule, paths: string[]) {
  for (const path of paths) {
    try {
      module.FS.unlink(path);
    } catch {
      // File may not exist after a failed qpdf run.
    }
  }
}

export async function encryptPdfWithPassword(file: File, password: string): Promise<Blob> {
  if (!password.trim()) throw new Error("Enter a password first.");
  const module = await getQpdfModule();
  const inputPath = `/input-${crypto.randomUUID()}.pdf`;
  const outputPath = `/protected-${crypto.randomUUID()}.pdf`;

  module.FS.writeFile(inputPath, new Uint8Array(await file.arrayBuffer()));
  try {
    runQpdf(module, [inputPath, "--encrypt", password, password, "256", "--", outputPath]);
    const output = module.FS.readFile(outputPath);
    return new Blob([output as BlobPart], { type: "application/pdf" });
  } finally {
    cleanup(module, [inputPath, outputPath]);
  }
}

export async function unlockPasswordPdf(file: File, password: string): Promise<Blob> {
  if (!password.trim()) throw new Error("Enter the PDF password first.");
  const module = await getQpdfModule();
  const inputPath = `/locked-${crypto.randomUUID()}.pdf`;
  const outputPath = `/unlocked-${crypto.randomUUID()}.pdf`;

  module.FS.writeFile(inputPath, new Uint8Array(await file.arrayBuffer()));
  try {
    runQpdf(module, [`--password=${password}`, "--decrypt", inputPath, outputPath]);
    const output = module.FS.readFile(outputPath);
    return new Blob([output as BlobPart], { type: "application/pdf" });
  } finally {
    cleanup(module, [inputPath, outputPath]);
  }
}
