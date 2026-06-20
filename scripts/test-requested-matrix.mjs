/**
 * Kullanıcının istediği manuel + otomatik kombinasyon matrisi.
 * Not: Bu script canlı cüzdan transferi yapmaz; servis/quote akışını doğrular.
 * Çalıştırma: npm run test:matrix
 */
const WEB = process.env.API_BASE ?? "http://localhost:3000";

const GAS_ESTIMATE_WEI = String(21_000n * 50_000_000_000n);

const CHAIN_FOR_ASSET = {
  ETH: "ethereum-sepolia",
  BASE: "base-sepolia",
  MON: "monad-testnet",
  SOL: "solana-devnet",
};

const CHAIN_ID_FOR_ASSET = {
  ETH: 11155111,
  BASE: 84532,
  MON: 10143,
  SOL: 900001,
};

/** Manuel USDC depozit kaynağı → otomatik mod native ödeme tokeni */
const SOURCE_TO_PAYMENT = {
  SOLUSDC: "SOL",
  ETHUSDC: "ETH",
  MONUSDC: "MON",
  BASEUSDC: "BASE",
  ARCUSDC: "ETH",
};

const manualCases = [
  { source: "SOLUSDC", targets: ["ETH", "BASE", "MON"] },
  { source: "ETHUSDC", targets: ["MON", "SOL", "BASE"] },
  { source: "MONUSDC", targets: ["ETH", "BASE", "SOL"] },
  { source: "BASEUSDC", targets: ["MON", "SOL", "ETH"] },
  { source: "ARCUSDC", targets: ["ETH", "MON", "BASE", "SOL"] },
];

const automaticCases = [
  { pay: "MON", targets: ["ETH", "BASE", "SOL"] },
  { pay: "ETH", targets: ["BASE", "SOL", "ETH"] },
  { pay: "BASE", targets: ["MON", "SOL", "ETH"] },
  { pay: "SOL", targets: ["ETH", "MON", "BASE"] },
];

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

async function quoteFee({ chain, paymentToken }) {
  const res = await fetch(`${WEB}/api/v1/quote/fee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chain, paymentToken, gasEstimateWei: GAS_ESTIMATE_WEI }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return body;
}

async function sponsorPrepare({ chainId, paymentToken }) {
  const res = await fetch(`${WEB}/api/v1/sponsor/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      chainId,
      intentId: `matrix_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      paymentToken,
      gasEstimateWei: GAS_ESTIMATE_WEI,
    }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return body;
}

console.log("=== GASSTATION İSTENEN TEST MATRİSİ ===\n");

await step("Servis sağlık kontrolü", async () => {
  const r = await fetch(`${WEB}/api/health`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return `env=${j.env}`;
});

for (const m of manualCases) {
  const paymentToken = SOURCE_TO_PAYMENT[m.source];
  if (!paymentToken) {
    results.push({ name: `Manuel ${m.source}`, ok: false, detail: "Bilinmeyen kaynak" });
    continue;
  }
  for (const target of m.targets) {
    const chain = CHAIN_FOR_ASSET[target];
    await step(`Manuel ${m.source} -> ${target}`, async () => {
      const q = await quoteFee({ chain, paymentToken });
      return `quote ${q.quoteId.slice(0, 8)}… ${q.paymentAmountFormatted} ${paymentToken}`;
    });
  }
}

for (const a of automaticCases) {
  for (const target of a.targets) {
    const chain = CHAIN_FOR_ASSET[target];
    const chainId = CHAIN_ID_FOR_ASSET[target];
    await step(`Otomatik ${a.pay} ile ${target}`, async () => {
      const q = await quoteFee({ chain, paymentToken: a.pay });
      const s = await sponsorPrepare({ chainId, paymentToken: a.pay });
      return `quote=${q.paymentAmountFormatted} ${a.pay} sponsor=${s.status}`;
    });
  }
}

const passed = results.filter((r) => r.ok).length;
const failed = results.length - passed;

console.log(`\n=== SONUÇ: ${passed}/${results.length} geçti ===`);
if (failed > 0) {
  console.log("\nBaşarısız testler:");
  for (const r of results.filter((x) => !x.ok)) {
    console.log(`  • ${r.name}: ${r.detail}`);
  }
  console.log(
    "\nİpucu: Sadece dev.cmd çalışıyorsa quote/settlement yedek modu devreye girer.",
  );
  console.log("Tam stack: .\\START_QUOTE_LITE.cmd veya .\\START_FULL_STACK.cmd");
  process.exit(1);
}
