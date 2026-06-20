/**
 * Hızlı testnet — API smoke + kasa kontrolü + Solana E2E (Sepolia yok)
 * Gereksinim: dev sunucusu açık (dev.cmd)
 *
 * Kullanım: node scripts/quick-testnet.mjs
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function run(label, args, env = process.env) {
  console.log(`\n--- ${label} ---\n`);
  const r = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env,
  });
  return r.status ?? 1;
}

console.log("=== GASSTATION QUICK TESTNET ===");
console.log("Sepolia atlanır · kasa korumalı $5 paket · Circle USDC (Solana devnet)\n");

const workflow = run("1/3 API smoke", ["scripts/test-workflow-report.mjs"]);
if (workflow !== 0) {
  console.log("\n❌ Dev sunucusu kapalı olabilir — önce: .\\dev.cmd");
  process.exit(1);
}

run("2/3 Kasa bakiye", ["scripts/check-treasury.mjs"]);

const e2e = run("3/3 Solana E2E", ["scripts/testnet-full-run.mjs"], {
  ...process.env,
  SKIP_SEPOLIA: "1",
});

console.log(e2e === 0 ? "\n✓ Quick testnet tamamlandı" : "\n⚠ Solana E2E eksik — aşağıdaki adımları uygulayın");
if (e2e !== 0) {
  console.log(`
Solana devnet USDC (Circle, ETH gerekmez):
  1. node scripts/gen-test-solana-wallet.mjs
  2. https://faucet.circle.com → Solana Devnet → $5 USDC
  3. .env.test.local → TEST_SOLANA_DEPOSITOR_PK + TEST_SOLANA_TARGET
  4. node scripts/quick-testnet.mjs
`);
}
process.exit(e2e);
