#!/usr/bin/env node
/**
 * Temiz dev başlatma: 3000/3001 portlarını boşalt, .next sil, dev sunucu aç.
 * Tüm node.exe öldürülmez — npm script kendini kesmez.
 */
import { spawnSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runNext = path.join(root, "scripts", "run-next.mjs");

function killPort(port) {
  if (process.platform !== "win32") return;
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
      shell: true,
    });
    const pids = new Set();
    for (const line of out.split("\n")) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid} /T`, { stdio: "ignore", shell: true });
        console.log(`[dev-reset] port ${port} → PID ${pid} durduruldu`);
      } catch {
        /* zaten kapalı */
      }
    }
  } catch {
    /* port boş */
  }
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  console.log(`[dev-reset] silindi: ${path.relative(root, dir)}`);
}

killPort(3000);
killPort(3001);

if (process.platform === "win32") {
  execSync("powershell -Command Start-Sleep -Seconds 2", { stdio: "ignore" });
}

rmDir(path.join(root, ".next"));
rmDir(path.join(root, "node_modules", ".cache"));

console.log("[dev-reset] Next.js dev başlatılıyor (http://localhost:3000)…\n");

const result = spawnSync(process.execPath, [runNext, "dev"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
