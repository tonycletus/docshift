/// <reference types="vite/client" />

declare module "pdfjs-dist" {
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export function getDocument(options: { data: Uint8Array }): {
    promise: Promise<{
      numPages: number;
      getPage(pageNumber: number): Promise<{
        getViewport(options: { scale: number }): { width: number; height: number };
        getTextContent(): Promise<{
          items: Array<{
            str?: string;
            transform?: number[];
            width?: number;
            height?: number;
          }>;
        }>;
        render(options: {
          canvasContext: CanvasRenderingContext2D;
          viewport: { width: number; height: number };
          canvas: HTMLCanvasElement;
        }): { promise: Promise<void> };
        cleanup(): void;
      }>;
      cleanup(): void;
    }>;
  };
}
