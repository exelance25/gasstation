/**
 * Operatör kasa + teslimat doğrulama
 * node scripts/check-operator-treasury.mjs [depositTxHash]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPublicClient,
  formatEther,
  formatUnits,
  http,
  parseAbiItem,
  decodeEventLog,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
};

function loadEnvLocal() {
  const path = resolve(".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const DEPOSIT_TX =
  process.argv[2] ??
  "0x10515cd15c070a48c6414377f78cfc41e88723a1f863290c5c181f37d0b5206a";
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B4d1570db724C8a581A04De0e4";
const COLLECTOR = process.env.COLLECTOR_ADDRESS;
const KEY = process.env.EVM_OPERATOR_PRIVATE_KEY;

if (!KEY) {
  console.error("EVM_OPERATOR_PRIVATE_KEY missing");
  process.exit(1);
}

const account = privateKeyToAccount(KEY.startsWith("0x") ? KEY : `0x${KEY}`);
const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC),
});
const monadClient = createPublicClient({
  chain: monadTestnet,
  transport: http("https://testnet-rpc.monad.xyz"),
});

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

const ledgerPath = resolve(".data/treasury-ledger.jsonl");
let ledgerEntry = null;
if (existsSync(ledgerPath)) {
  for (const line of readFileSync(ledgerPath, "utf8").split("\n")) {
    if (!line.includes(DEPOSIT_TX.slice(2, 10))) continue;
    try {
      ledgerEntry = JSON.parse(line);
    } catch {
      /* */
    }
  }
}

console.log("=== Operator ===");
console.log("address:", account.address);
console.log("collector:", COLLECTOR);

const [sepBal, monBal] = await Promise.all([
  sepoliaClient.getBalance({ address: account.address }),
  monadClient.getBalance({ address: account.address }),
]);
console.log("Sepolia ETH:", formatEther(sepBal));
console.log("Monad MON:", formatEther(monBal));

console.log("\n=== Deposit tx ===", DEPOSIT_TX);
const receipt = await sepoliaClient.getTransactionReceipt({ hash: DEPOSIT_TX });
console.log("status:", receipt.status, "block:", receipt.blockNumber);

for (const log of receipt.logs) {
  if (log.address.toLowerCase() !== USDC_SEPOLIA.toLowerCase()) continue;
  try {
    const d = decodeEventLog({ abi: [transferEvent], data: log.data, topics: log.topics });
    if (d.eventName !== "Transfer") continue;
    console.log(
      "USDC:",
      formatUnits(d.args.value, 6),
      "from",
      d.args.from,
      "to",
      d.args.to,
    );
  } catch {
    /* */
  }
}

if (ledgerEntry) {
  console.log("\n=== Ledger entry ===");
  console.log(JSON.stringify(ledgerEntry, null, 2));
  const target = ledgerEntry.targetAddress;
  const delivery = ledgerEntry.deliveryTxHash;
  console.log("\n=== Delivery tx (Monad) ===", delivery);
  try {
    const dr = await monadClient.getTransactionReceipt({ hash: delivery });
    console.log("status:", dr.status, "block:", dr.blockNumber);
    const tb = await monadClient.getBalance({ address: target });
    console.log("Target MON balance:", formatEther(tb), target);
  } catch (e) {
    console.log("delivery lookup failed:", e.message);
  }
}
