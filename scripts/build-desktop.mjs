import { cp, mkdir, rm, writeFile } from "node:fs/promises";
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

await run("node", ["node_modules/vite/bin/vite.js", "build"], {
  VITE_APP_DESKTOP: "true",
  VITE_PUBLIC_APP_URL: "https://docshift.tonycletus.com",
});

await rm(desktopDist, { recursive: true, force: true });
await mkdir(desktopDist, { recursive: true });
await cp(distClient, desktopDist, { recursive: true });
await writeFile(join(desktopDist, ".gitkeep"), "");
