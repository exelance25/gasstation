/**
 * Katman A-E saglik kontrolu — UI acmadan tum servisleri kontrol eder
 * Kullanim: npm run preflight:stack
 */
const WEB = process.env.API_BASE ?? "http://localhost:3000";
const QUOTE = process.env.QUOTE_ENGINE_URL ?? "http://localhost:4100";
const SETTLEMENT = process.env.SETTLEMENT_ENGINE_URL ?? "http://localhost:4200";
const MARKETPLACE = process.env.MARKETPLACE_URL ?? "http://localhost:4000";

const results = [];

async function step(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name, ok: false, detail: msg });
    console.log(`✗ ${name} — ${msg}`);
  }
}

console.log("=== GASSTATION KATMAN KONTROLU ===\n");

await step("Katman A — Quote Engine", async () => {
  const r = await fetch(`${QUOTE}/health`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
});

await step("Katman B — Settlement Engine", async () => {
  const r = await fetch(`${SETTLEMENT}/health`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
});

await step("Katman E — Marketplace API", async () => {
  const r = await fetch(`${MARKETPLACE}/health`);
  if (!r.ok) throw new Error(`HTTP ${r.status} — docker + marketplace calisiyor mu?`);
  return await r.text();
});

await step("Web API health", async () => {
  const r = await fetch(`${WEB}/api/health`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return `env=${j.env}`;
});

await step("Web quote proxy (yerel yedek dahil)", async () => {
  const r = await fetch(`${WEB}/api/v1/quote/fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chain: "monad-testnet",
      paymentToken: "MON",
      gasEstimateWei: String(21_000n * 50_000_000_000n),
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return `~${j.paymentAmountFormatted} MON`;
});

await step("Quote — test paket 0.10 USDC", async () => {
  const r = await fetch(`${QUOTE}/v1/quote/fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chain: "monad-testnet",
      paymentToken: "MON",
      gasEstimateWei: String(21_000n * 50_000_000_000n),
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return `~${j.paymentAmountFormatted} MON`;
});

const passed = results.filter((r) => r.ok).length;
console.log(`\n=== ${passed}/${results.length} katman hazir ===`);
if (passed < results.length) {
  console.log("\nEksik servisler:");
  for (const r of results.filter((x) => !x.ok)) {
    console.log(`  • ${r.name}: ${r.detail}`);
  }
  console.log("\nDocker'siz: .\\START_QUOTE_LITE.cmd  (Quote+Settlement+Web)");
  console.log("Tam stack:  .\\START_FULL_STACK.cmd     (Docker + Marketplace)");
  console.log("Sadece web: dev.cmd + npm run test:matrix (yerel quote yedegi)");
  process.exit(1);
}
