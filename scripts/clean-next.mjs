#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const targets = [
  path.join(root, ".next"),
  path.join(root, "node_modules", ".cache"),
];

function rmWithRetry(dir) {
  if (!fs.existsSync(dir)) return false;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      return true;
    } catch (e) {
      if (attempt === 2) throw e;
    }
  }
  return false;
}

for (const dir of targets) {
  if (rmWithRetry(dir)) {
    console.log(`[clean] silindi: ${path.relative(root, dir)}`);
  }
}

console.log("[clean] tamam — npm run dev ile yeniden başlatın");
