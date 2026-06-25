import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = join(root, "public", "tesseract");

const assets = [
  ["tesseract.js/dist/worker.min.js", "worker.min.js"],
  ["tesseract.js-core/tesseract-core-lstm.wasm.js", "tesseract-core-lstm.wasm.js"],
  ["@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "eng.traineddata.gz"],
];

await mkdir(publicDir, { recursive: true });

for (const [packagePath, filename] of assets) {
  const source = fileURLToPath(import.meta.resolve(packagePath));
  const target = join(publicDir, filename);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(source, target);
}
