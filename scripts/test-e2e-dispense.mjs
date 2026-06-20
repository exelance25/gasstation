/**
 * Uçtan uca: USDC depozit → POST /api/gas/dispense → MON teslimatı
 *
 * Kullanım:
 *   # Phantom ile depozit yaptıysanız (tx hash ile):
 *   DEPOSIT_TX_HASH=0x... node scripts/test-e2e-dispense.mjs
 *
 *   # Otomatik depozit (test cüzdanı private key):
 *   TEST_DEPOSITOR_PRIVATE_KEY=0x... node scripts/test-e2e-dispense.mjs
 *
 *   # Sunucu çalışıyor olmalı: npm run dev:clean
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  formatUnits,
  http,
  parseAbi,
  parseUnits,
  waitForTransactionReceipt,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

const API_BASE = process.env.API_BASE ?? "http://localhost:3000";
const PACKAGE_USD = Number(process.env.PACKAGE_USD ?? "5");
const TARGET_ASSET = process.env.TARGET_ASSET ?? "MON";
const TEST_RECIPIENT =
  process.env.TEST_GAS_RECIPIENT ?? "0xd815dA511bC7D687A0909B47E1e78785D658293A";

const MONAD_USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";
const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC ?? "https://testnet-rpc.monad.xyz"],
    },
  },
});

const rpc = monadTestnet.rpcUrls.default.http[0];
const publicClient = createPublicClient({ chain: monadTestnet, transport: http(rpc) });
const collector = process.env.COLLECTOR_ADDRESS ?? process.env.NEXT_PUBLIC_COLLECTOR_ADDRESS;

if (!collector?.startsWith("0x")) {
  console.error("FAIL: COLLECTOR_ADDRESS yok");
  process.exit(1);
}

console.log("=== PUMPSTATION E2E DISPENSE ===\n");
console.log("API:", API_BASE);
console.log("Collector:", collector);
console.log("Paket: $" + PACKAGE_USD, TARGET_ASSET, "→", TEST_RECIPIENT);

async function fetchQuote() {
  const r = await fetch(
    `${API_BASE}/api/oracle/quote?package=${PACKAGE_USD}&asset=${TARGET_ASSET}`,
  );
  if (!r.ok) throw new Error(`Oracle HTTP ${r.status}`);
  return r.json();
}

async function postDispense(depositTxHash) {
  const r = await fetch(`${API_BASE}/api/gas/dispense`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      txHash: depositTxHash,
      targetAsset: TARGET_ASSET,
      targetAddress: TEST_RECIPIENT,
      packageAmount: PACKAGE_USD,
    }),
  });
  const body = await r.json().catch(() => ({}));
  return { status: r.status, body };
}

async function resolveDepositTxHash() {
  const fromEnv = (process.env.DEPOSIT_TX_HASH ?? "").trim();
  if (fromEnv.startsWith("0x") && fromEnv.length === 66) return fromEnv;

  const depositorPk = (
    process.env.TEST_DEPOSITOR_PRIVATE_KEY ?? process.env.DEPOSITOR_PRIVATE_KEY ?? ""
  ).trim();
  if (!depositorPk || depositorPk.length < 64) {
    return null;
  }

  const depositor = privateKeyToAccount(
    depositorPk.startsWith("0x") ? depositorPk : `0x${depositorPk}`,
  );
  const walletClient = createWalletClient({
    account: depositor,
    chain: monadTestnet,
    transport: http(rpc),
  });

  const amount = parseUnits(String(PACKAGE_USD), 6);
  const bal = await publicClient.readContract({
    address: MONAD_USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [depositor.address],
  });

  console.log("\nDepozitör:", depositor.address);
  console.log("Depozitör USDC:", formatUnits(bal, 6));

  if (bal < amount) {
    throw new Error(
      `Depozitörde yeterli USDC yok (gerekli $${PACKAGE_USD}). Circle faucet: https://faucet.circle.com → Monad Testnet`,
    );
  }

  console.log(`\n→ $${PACKAGE_USD} USDC collector'a gönderiliyor...`);
  const hash = await walletClient.writeContract({
    address: MONAD_USDC,
    abi: erc20Abi,
    functionName: "transfer",
    args: [collector, amount],
  });
  console.log("Depozit tx:", hash);
  console.log("Explorer:", `https://testnet.monadvision.com/tx/${hash}`);

  const receipt = await waitForTransactionReceipt(publicClient, { hash, timeout: 120_000 });
  if (receipt.status !== "success") throw new Error("USDC depozit tx revert");
  return hash;
}

async function waitForUserDeposit(timeoutMs = 180_000) {
  const before = await publicClient.readContract({
    address: MONAD_USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [collector],
  });
  const need = parseUnits(String(PACKAGE_USD), 6);
  console.log("\nCollector USDC (önce):", formatUnits(before, 6));
  console.log(`Phantom'dan $${PACKAGE_USD} USDC transferi bekleniyor (max ${timeoutMs / 1000}s)...`);

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 4000));
    const logs = await scanRecentDeposits(200);
    for (const log of logs) {
      if (log.args.value >= need) return log.transactionHash;
    }
  }
  return null;
}

async function scanRecentDeposits(range = 200) {
  const block = await publicClient.getBlockNumber();
  const transfer = parseAbi([
    "event Transfer(address indexed from, address indexed to, uint256 value)",
  ])[0];
  const found = [];
  for (let end = block; end > block - BigInt(range); end -= 99n) {
    const start = end - 99n > 0n ? end - 99n : 0n;
    try {
      const logs = await publicClient.getLogs({
        address: MONAD_USDC,
        event: transfer,
        args: { to: collector },
        fromBlock: start,
        toBlock: end,
      });
      found.push(...logs);
    } catch {
      /* RPC 100-block limit */
    }
  }
  return found.sort((a, b) => Number(b.blockNumber - a.blockNumber));
}

const recipientBefore = await publicClient.getBalance({ address: TEST_RECIPIENT });
console.log("\nAlıcı MON (önce):", formatEther(recipientBefore));

let depositTxHash = await resolveDepositTxHash();

if (!depositTxHash) {
  const recent = await scanRecentDeposits(500);
  const need = parseUnits(String(PACKAGE_USD), 6);
  const hit = recent.find((l) => l.args.value >= need);
  if (hit) {
    depositTxHash = hit.transactionHash;
    console.log("\nSon depozit bulundu:", depositTxHash);
  }
}

if (!depositTxHash) {
  depositTxHash = await waitForUserDeposit(
    Number(process.env.DEPOSIT_WAIT_MS ?? "120000"),
  );
}

if (!depositTxHash) {
  console.error(`
FAIL: USDC depozit bulunamadı.

Seçenekler:
  1) Phantom → Monad Testnet → $${PACKAGE_USD} USDC → ${collector}
     sonra: DEPOSIT_TX_HASH=0x... node scripts/test-e2e-dispense.mjs

  2) TEST_DEPOSITOR_PRIVATE_KEY=0x... node scripts/test-e2e-dispense.mjs
`);
  process.exit(1);
}

const quote = await fetchQuote();
console.log("\nOracle quote:", {
  estimatedGas: quote.estimatedGasAmount?.toFixed?.(4) ?? quote.estimatedGasAmount,
  netUsd: quote.netUsdForGas,
  source: quote.oracle?.source,
});

console.log("\n→ Dispense API çağrılıyor...");
const { status, body } = await postDispense(depositTxHash);
console.log("Dispense HTTP:", status);
console.log(JSON.stringify(body, null, 2));

if (status !== 200 || !body.ok) {
  console.error("\nFAIL: Dispense başarısız");
  process.exit(1);
}

const recipientAfter = await publicClient.getBalance({ address: TEST_RECIPIENT });
console.log("\nAlıcı MON (sonra):", formatEther(recipientAfter));
console.log("MON artışı:", formatEther(recipientAfter - recipientBefore));

console.log("\nPASS: E2E dispense tamamlandı");
console.log("Depozit:", body.depositTxHash);
console.log("Teslimat:", body.deliveryTxHash);
if (body.deliveryTxHash) {
  console.log("Explorer:", `https://testnet.monadvision.com/tx/${body.deliveryTxHash}`);
}
