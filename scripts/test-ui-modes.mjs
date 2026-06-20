/**
 * Manuel + Otomatik mod API smoke testi
 * Kullanım: npm run test:modes
 * Gereksinim: dev sunucusu ayakta (.\dev.cmd)
 */
const WEB = process.env.API_BASE ?? "http://localhost:3000";

const GAS_ESTIMATE_WEI = String(21_000n * 50_000_000_000n);
const TEST_USER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const results = [];

async function step(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    results.push({ name, ok: false, detail: message });
    console.log(`✗ ${name} — ${message}`);
  }
}

console.log("=== GASSTATION MANUEL + OTOMATİK MOD TESTİ ===\n");

await step("Health — mod bayrakları", async () => {
  const r = await fetch(`${WEB}/api/health`);
  const j = await r.json();
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  if (!j.features?.manualGas) throw new Error("manuelGas kapalı");
  if (!j.features?.automaticGas) throw new Error("automaticGas kapalı");
  return `manuel=on otomatik=on env=${j.env}`;
});

await step("Config — gasModes", async () => {
  const r = await fetch(`${WEB}/api/config`);
  const j = await r.json();
  if (!j.features?.gasModes?.manual || !j.features?.gasModes?.automatic) {
    throw new Error("gasModes eksik veya kapalı");
  }
  return `autoFee=${j.features.autoFee}`;
});

await step("Manuel — precheck ETH teslimat", async () => {
  const r = await fetch(`${WEB}/api/gas/precheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetAsset: "ETH",
      packageAmount: 0.1,
      targetAddress: TEST_USER,
    }),
  });
  const j = await r.json();
  if (!r.ok && r.status !== 422) throw new Error(j.reason ?? `HTTP ${r.status}`);
  return j.ok ? `~${j.estimatedGasAmount} ETH hazır` : `precheck: ${j.reason}`;
});

await step("Manuel — precheck BASE teslimat", async () => {
  const r = await fetch(`${WEB}/api/gas/precheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetAsset: "BASE",
      packageAmount: 0.05,
      targetAddress: TEST_USER,
    }),
  });
  const j = await r.json();
  if (!r.ok && r.status !== 422) throw new Error(j.reason ?? `HTTP ${r.status}`);
  return j.ok ? `~${j.estimatedGasAmount} BASE hazır` : `precheck: ${j.reason}`;
});

await step("Otomatik — quote (BASE öde → ETH gas)", async () => {
  const r = await fetch(`${WEB}/api/v1/quote/fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chain: "ethereum-sepolia",
      paymentToken: "BASE",
      gasEstimateWei: GAS_ESTIMATE_WEI,
      userAddress: TEST_USER,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return `${j.paymentAmountFormatted.toFixed(6)} BASE`;
});

await step("Otomatik — sponsor hazırlık", async () => {
  const r = await fetch(`${WEB}/api/v1/sponsor/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userAddress: TEST_USER,
      chainId: 11155111,
      intentId: `modes_${Date.now()}`,
      paymentToken: "ETH",
      gasEstimateWei: GAS_ESTIMATE_WEI,
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  if (j.status !== "quote_ready") throw new Error(`status=${j.status}`);
  return j.sponsorshipId;
});

await step("Otomatik — settle reddi (sahte tx)", async () => {
  const qr = await fetch(`${WEB}/api/v1/quote/fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chain: "ethereum-sepolia",
      paymentToken: "ETH",
      gasEstimateWei: GAS_ESTIMATE_WEI,
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
      signature: quote.signature,
      paymentTxHash: "0x" + "ab".repeat(32),
      payerAddress: TEST_USER,
      beneficiaryAddress: TEST_USER,
    }),
  });
  if (r.status === 200) throw new Error("sahte ödeme kabul edilmemeliydi");
  const j = await r.json();
  return j.error ?? `HTTP ${r.status}`;
});

const passed = results.filter((r) => r.ok).length;
console.log(`\n=== SONUÇ: ${passed}/${results.length} geçti ===`);
console.log(
  "\nTarayıcı testi: http://localhost:3000/yakit-al — üstte Manuel / Otomatik geçiş yapın.",
);
if (passed < results.length) process.exit(1);
