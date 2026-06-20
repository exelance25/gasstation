/**
 * GASSTATION — Quote + Settlement stack smoke test
 * Kullanım: npm run test:stack-auto-fee
 * Gereksinim: quote-engine (:4100), settlement (:4200), web (:3000) ayakta
 */
const WEB = process.env.API_BASE ?? "http://localhost:3000";
const QUOTE = process.env.QUOTE_ENGINE_URL ?? "http://localhost:4100";
const SETTLEMENT = process.env.SETTLEMENT_ENGINE_URL ?? "http://localhost:4200";

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

console.log("=== GASSTATION AUTO-FEE STACK TEST ===\n");

await step("Quote Engine health", async () => {
  const r = await fetch(`${QUOTE}/health`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
});

await step("Settlement Engine health", async () => {
  const r = await fetch(`${SETTLEMENT}/health`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.text();
});

await step("Web health", async () => {
  const r = await fetch(`${WEB}/api/health`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return `env=${j.env}`;
});

await step("Quote /v1/quote/fee (direct)", async () => {
  const r = await fetch(`${QUOTE}/v1/quote/fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chain: "base-sepolia",
      paymentToken: "BASE",
      gasEstimateWei: String(21_000n * 50_000_000_000n),
      userAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  if (!j.quoteId || !j.paymentAmount) throw new Error("eksik quote alanları");
  return `${j.paymentAmountFormatted} ${j.paymentToken}, signed=${Boolean(j.signature)}`;
});

await step("Quote proxy /api/v1/quote/fee", async () => {
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

await step("Sponsor prepare /api/v1/sponsor/prepare", async () => {
  const r = await fetch(`${WEB}/api/v1/sponsor/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      chainId: 84532,
      intentId: `test_${Date.now()}`,
      paymentToken: "BASE",
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j.sponsorshipId ?? j.message ?? "ok";
});

await step("Settle rejects fake payment tx", async () => {
  const qr = await fetch(`${QUOTE}/v1/quote/fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chain: "ethereum-sepolia",
      paymentToken: "ETH",
      gasEstimateWei: String(21_000n * 50_000_000_000n),
    }),
  });
  const quote = await qr.json();
  if (!qr.ok) throw new Error("quote alınamadı");

  const r = await fetch(`${WEB}/api/v1/settle/fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteId: quote.quoteId,
      chain: quote.chain,
      paymentToken: quote.paymentToken,
      gasEstimateWei: quote.gasEstimateWei,
      paymentAmount: quote.paymentAmount,
      expiresAt: quote.expiresAt,
      signature: quote.signature ?? "0x" + "00".repeat(65),
      paymentTxHash: "0x" + "ab".repeat(32),
      payerAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      beneficiaryAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    }),
  });
  if (r.status === 200) throw new Error("fake tx kabul edilmemeliydi");
  const j = await r.json();
  return j.error ?? `HTTP ${r.status}`;
});

await step("Relay prepare (gas purchase callData)", async () => {
  const r = await fetch(`${WEB}/api/relay/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      usePaymaster: false,
    }),
  });
  if (r.status === 503) return "relayer kapalı — atlandı";
  const j = await r.json();
  if (!r.ok && r.status !== 401) throw new Error(j.error ?? `HTTP ${r.status}`);
  return r.ok ? "userOp hazır" : `HTTP ${r.status} (auth gerekebilir)`;
});

await step("Relay status", async () => {
  const r = await fetch(`${WEB}/api/relay/status`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return j.enabled ? "relayer aktif" : "relayer kapalı (RELAYER_PRIVATE_KEY yok)";
});

const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;

console.log(`\n=== SONUÇ: ${passed}/${results.length} geçti ===`);
if (failed > 0) process.exit(1);
