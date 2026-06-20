/**
 * Dispense API + oracle health check
 */
const BASE = process.env.API_BASE ?? "http://localhost:3000";

async function check(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (e) {
    console.log(`✗ ${name}:`, e.message);
    return false;
  }
}

let passed = 0;
let total = 0;

total++;
if (
  await check("Oracle quote ETH $10", async () => {
    const r = await fetch(`${BASE}/api/oracle/quote?package=10&asset=MON`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (!j.estimatedGasAmount || j.estimatedGasAmount <= 0) throw new Error("invalid quote");
    console.log(`  → ~${j.estimatedGasAmount.toFixed(4)} MON, net $${j.netUsdForGas}`);
  })
)
  passed++;

total++;
if (
  await check("Dispense rejects fake tx", async () => {
    const r = await fetch(`${BASE}/api/gas/dispense`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        txHash: "0x" + "0".repeat(64),
        targetAsset: "MON",
        targetAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        packageAmount: 10,
      }),
    });
    if (r.status !== 422) throw new Error(`expected 422 got ${r.status}`);
  })
)
  passed++;

total++;
if (
  await check("Health endpoint", async () => {
    const r = await fetch(`${BASE}/api/health`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    if (!j.ok || !j.operators?.evm) throw new Error("health incomplete");
  })
)
  passed++;

total++;
if (
  await check("Yakit-al page", async () => {
    const r = await fetch(`${BASE}/yakit-al`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    if (!html.includes("GASSTATION")) throw new Error("page content missing");
  })
)
  passed++;

console.log(`\n${passed}/${total} API checks passed`);
process.exit(passed === total ? 0 : 1);
