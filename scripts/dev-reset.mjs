#!/usr/bin/env node
/** Yalnızca port + cache temizliği (dev başlatmaz) */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function killPort(port) {
  if (process.platform !== "win32") return;
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      shell: true,
    });
    for (const line of out.split("\n")) {
      if (!line.includes("LISTENING")) continue;
      const pid = line.trim().split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid)) {
        execSync(`taskkill /F /PID ${pid} /T 2>nul`, { stdio: "ignore", shell: true });
      }
    }
  } catch {
    /* boş */
  }
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  console.log(`[clean] silindi: ${path.relative(root, dir)}`);
}

killPort(3000);
killPort(3001);
rmDir(path.join(root, ".next"));
rmDir(path.join(root, "node_modules", ".cache"));
console.log("[clean] tamam");
