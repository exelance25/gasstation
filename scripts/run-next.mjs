#!/usr/bin/env node
/**
 * next dev/build/start — lokal TLS bypass ile başlatır.
 * Kullanım: node scripts/run-next.mjs dev | build | start | exec <cmd...>
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { applyDevTlsBypass } = require("./ensure-dev-tls.cjs");

applyDevTlsBypass();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");

const [command = "dev", ...rest] = process.argv.slice(2);

if (command === "exec") {
  const [bin, ...binArgs] = rest;
  const result = spawnSync(bin, binArgs, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  process.exit(result.status ?? 1);
}

const result = spawnSync(process.execPath, [nextBin, command, ...rest], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
