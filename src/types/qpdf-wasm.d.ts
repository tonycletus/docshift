declare module "@jspawn/qpdf-wasm/qpdf.js" {
  interface QpdfModule {
    callMain(args: string[]): number;
    FS: {
      writeFile(path: string, data: Uint8Array): void;
      readFile(path: string): Uint8Array;
      unlink(path: string): void;
    };
  }

  interface QpdfOptions {
    locateFile?: (file: string) => string;
    print?: (text: string) => void;
    printErr?: (text: string) => void;
  }

  export default function qpdfFactory(options?: QpdfOptions): Promise<QpdfModule>;
}

declare module "@jspawn/qpdf-wasm/qpdf.wasm?url" {
  const url: string;
  export default url;
}
