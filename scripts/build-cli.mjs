import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const cliDir = join(root, "packages", "cli");
const cliBin = join(cliDir, "bin", "docshift.mjs");
const outDir = join(root, "release", "cli");
const npmCache = join(root, "tmp", "npm-cache");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      env: { ...process.env, ...options.env },
      stdio: "inherit",
      shell: process.platform === "win32" && command.endsWith(".cmd"),
    });
    child.on("exit", (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await mkdir(npmCache, { recursive: true });

await run("node", [cliBin, "doctor", "--json"]);
await run(npmCmd, ["pack", "--pack-destination", outDir], {
  cwd: cliDir,
  env: { npm_config_cache: npmCache },
});
