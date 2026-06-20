/**
 * PUMPSTATION — iş akışı + API test raporu
 */
const BASE = process.env.API_BASE ?? "http://localhost:3000";

const results = [];

async function step(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push({ name, ok: false, detail: msg });
    console.log(`✗ ${name} — ${msg}`);
    return false;
  }
}

console.log("=== PUMPSTATION TEST RAPORU ===\n");
console.log(`Base URL: ${BASE}\n`);

await step("Health endpoint", async () => {
  const r = await fetch(`${BASE}/api/health`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (!j.ok) throw new Error("ok=false");
  return `env=${j.env} evm_op=${j.operators?.evm} sol_op=${j.operators?.solana} wc=${j.walletConnect}`;
});

for (const asset of ["ETH", "MON", "BASE", "SOL"]) {
  await step(`Oracle quote $0.10 → ${asset}`, async () => {
    const r = await fetch(`${BASE}/api/oracle/quote?package=0.1&asset=${asset}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (!j.estimatedGasAmount || j.estimatedGasAmount <= 0) throw new Error("invalid amount");
    return `~${j.estimatedGasAmount} ${asset}, net $${j.netUsdForGas}, src=${j.source ?? "?"}`;
  });
}

await step("Dispense rejects fake EVM tx", async () => {
  const r = await fetch(`${BASE}/api/gas/dispense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      txHash: "0x" + "0".repeat(64),
      targetAsset: "MON",
      targetAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      packageAmount: 0.1,
    }),
  });
  if (r.status !== 422) throw new Error(`expected 422, got ${r.status}`);
  const j = await r.json();
  return j.error ?? j.reason ?? "rejected";
});

await step("Dispense rejects invalid Solana sig", async () => {
  const r = await fetch(`${BASE}/api/gas/dispense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      txHash: "5".repeat(88),
      targetAsset: "SOL",
      targetAddress: "11111111111111111111111111111112",
      packageAmount: 5,
    }),
  });
  if (r.status !== 422 && r.status !== 400) throw new Error(`expected 422/400, got ${r.status}`);
  return `HTTP ${r.status}`;
});

await step("Yakit-al page renders", async () => {
  const r = await fetch(`${BASE}/yakit-al`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  const checks = [
    ["PUMPSTATION", html.includes("PUMPSTATION")],
    ["Cüzdan Bağla", html.includes("Cüzdan Bağla") || html.includes("CÜZDAN BAĞLA")],
    ["ATEŞLE", html.includes("ATEŞLE")],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([n]) => n);
  if (missing.length) throw new Error(`missing: ${missing.join(", ")}`);
  return "UI shell OK";
});

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);

console.log(`\n=== ÖZET: ${passed}/${results.length} geçti ===`);
if (failed.length) {
  console.log("\nBaşarısız:");
  for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}
