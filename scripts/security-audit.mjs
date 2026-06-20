/**
 * Kasa anahtarı sızıntı taraması — commit edilebilir dosyalarda private key arar.
 * Kullanım: npm run security:audit
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const HEX_KEY = /0x[0-9a-fA-F]{64}/g;
const BASE58_SOL_KEY = /[1-9A-HJ-NP-Za-km-z]{80,90}/g;

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "out",
  "dist",
  "coverage",
  ".data",
  "agent-transcripts",
]);

const ALLOWLIST_FILES = new Set([
  ".env.example",
  ".env.testnet.example",
  ".env.mainnet.example",
  ".env.test.local.example",
]);

const issues = [];

function listTrackedFiles() {
  try {
    const out = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" });
    return out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((f) => !SKIP_DIRS.has(f.split("/")[0]));
  } catch {
    return [];
  }
}

function scanFile(relPath) {
  if (ALLOWLIST_FILES.has(relPath.replace(/\\/g, "/"))) return;
  const abs = resolve(ROOT, relPath);
  if (!existsSync(abs)) return;

  let text;
  try {
    text = readFileSync(abs, "utf8");
  } catch {
    return;
  }

  if (relPath.includes(".env") && !relPath.endsWith(".example")) {
    issues.push(`${relPath}: .env dosyası git'te izleniyor olabilir — hemen kaldırın`);
    return;
  }

  for (const match of text.match(HEX_KEY) ?? []) {
    if (match === "0x0000000000000000000000000000000000000000000000000000000000000000") continue;
    if (relPath.endsWith(".example") && match.includes("...")) continue;
    if (relPath.endsWith(".example") && match === "0x0000000000000000000000000000000000000000000000000000000000000001") continue;
    if (relPath.endsWith(".example") && /^0x[a-fA-F0-9]{2,63}$/.test(match.replace("0x", "0x"))) {
      if (match.length < 66) continue;
    }
    if (relPath.endsWith(".example") && match.length === 66 && match.includes("...")) continue;
    // placeholder in examples: 0x...
    if (relPath.endsWith(".example") && /0x\.{3}/.test(text)) continue;
    issues.push(`${relPath}: olası EVM private key (${match.slice(0, 10)}…)`);
  }

  if (!relPath.endsWith(".md") && !relPath.endsWith(".jsonl")) {
    for (const match of text.match(BASE58_SOL_KEY) ?? []) {
      if (relPath.endsWith(".example")) continue;
      issues.push(`${relPath}: olası Solana secret key (${match.slice(0, 8)}…)`);
    }
  }
}

function checkEnvGitignore() {
  const gi = readFileSync(resolve(ROOT, ".gitignore"), "utf8");
  for (const needle of [".env.local", ".env*.local", "agent-transcripts"]) {
    if (!gi.includes(needle)) {
      issues.push(`.gitignore: "${needle}" eksik`);
    }
  }
}

function checkLocalEnvFiles() {
  const testLocal = resolve(ROOT, ".env.test.local");
  if (existsSync(testLocal)) {
    const content = readFileSync(testLocal, "utf8");
    if (/TEST_.*_PK=/.test(content) || /DEPOSITOR_PK=/.test(content)) {
      issues.push(".env.test.local: test private key bulundu — silin veya boşaltın");
    }
  }
}

function checkPublicEnv() {
  for (const key of Object.keys(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    const upper = key.toUpperCase();
    if (
      upper.includes("PRIVATE") ||
      upper.includes("SECRET") ||
      upper.includes("MNEMONIC")
    ) {
      issues.push(`Ortam: ${key} public prefix ile tanımlı — kaldırın`);
    }
  }
}

console.log("=== PUMPSTATION GÜVENLİK TARAMASI ===\n");

checkEnvGitignore();
checkLocalEnvFiles();
checkPublicEnv();

const files = listTrackedFiles();
for (const f of files) scanFile(f);

if (issues.length === 0) {
  console.log("✓ İzlenen dosyalarda anahtar sızıntısı bulunamadı");
  console.log("✓ .env.local gitignore'da");
  console.log("✓ Test anahtar dosyası (.env.test.local) temiz veya yok");
  console.log("\nKasa anahtarları yalnızca sunucu ortamında (.env.local) kalmalı.");
  console.log("Sohbet geçmişinde paylaşılan anahtarları döndürün (rotate).");
  process.exit(0);
}

console.log(`✗ ${issues.length} sorun:\n`);
for (const i of issues) console.log("  -", i);
process.exit(1);
