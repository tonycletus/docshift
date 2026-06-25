import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distClient = join(root, "dist", "client");
const desktopDist = join(root, "native", "desktop", "frontend", "dist");

function run(command, args, env = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("exit", (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

await run("node", ["scripts/copy-tesseract-assets.mjs"]);
await run("node", ["node_modules/vite/bin/vite.js", "build"], {
  VITE_APP_DESKTOP: "true",
  VITE_PUBLIC_APP_URL: "https://docshift.tonycletus.com",
});

await rm(desktopDist, { recursive: true, force: true });
await mkdir(desktopDist, { recursive: true });
await cp(distClient, desktopDist, { recursive: true });
await writeDesktopIndex();
await writeFile(join(desktopDist, ".gitkeep"), "");

async function writeDesktopIndex() {
  const assetsDir = join(distClient, "assets");
  const assets = await readdir(assetsDir);
  const jsAssets = assets.filter((asset) => asset.endsWith(".js"));
  const cssAsset = assets.find((asset) => asset.startsWith("styles-") && asset.endsWith(".css"));
  let entryAsset = "";

  for (const asset of jsAssets) {
    const source = await readFile(join(assetsDir, asset), "utf8");
    if (source.includes("hydrateRoot(document")) {
      entryAsset = asset;
      break;
    }
  }

  if (!entryAsset) {
    throw new Error("Could not find the desktop client entry asset.");
  }

  const stylesheet = cssAsset ? `    <link rel="stylesheet" href="/assets/${cssAsset}" />\n` : "";

  await writeFile(
    join(desktopDist, "index.html"),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#2563eb" />
    <title>DocShift</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
${stylesheet}  </head>
  <body>
    <script type="module" src="/assets/${entryAsset}"></script>
  </body>
</html>
`,
  );
}
