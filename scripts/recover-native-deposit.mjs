/**
 * Sepolia native ETH depozit → MON/ETH teslimat kurtarma
 *
 * Kullanım (deploy sonrası):
 *   set API_BASE=https://gasstation-flame.vercel.app
 *   set TX=0x834fb9243074cc71019c98fc08b3f51106ae0fdc19c1a162281209f333f42d47
 *   set TARGET=0xYourWallet
 *   set ASSET=MON
 *   node scripts/recover-native-deposit.mjs
 */
import { createPublicClient, formatEther, http } from "viem";
import { sepolia } from "viem/chains";

const API_BASE = process.env.API_BASE ?? "https://gasstation-flame.vercel.app";
const TX =
  process.env.TX ??
  "0x834fb9243074cc71019c98fc08b3f51106ae0fdc19c1a162281209f333f42d47";
const TARGET = process.env.TARGET?.trim();
const ASSET = (process.env.ASSET ?? "MON").toUpperCase();
const PACKAGE = Number(process.env.PACKAGE ?? "0");
const TREASURY = "0x28Be8f458b2b950233d2C7645f36ED3Ebc861e73";

const client = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

const tx = await client.getTransaction({ hash: TX });
const receipt = await client.getTransactionReceipt({ hash: TX });

console.log("=== Sepolia depozit ===");
console.log("status:", receipt?.status);
console.log("from:", tx?.from);
console.log("to:", tx?.to);
console.log("value ETH:", tx ? formatEther(tx.value) : "?");
console.log("treasury match:", tx?.to?.toLowerCase() === TREASURY.toLowerCase());

if (!TARGET) {
  console.error("\nTARGET env gerekli — MON alacak cüzdan adresi (0x...)");
  process.exit(1);
}

const body = {
  txHash: TX,
  targetAsset: ASSET,
  targetAddress: TARGET,
  packageAmount: PACKAGE > 0 ? PACKAGE : undefined,
  depositorAddress: tx?.from,
};

if (!body.packageAmount) {
  console.warn("\nPACKAGE belirtilmedi — sunucu native miktardan otomatik çıkaracak (recoveryMode).");
  body.packageAmount = 1;
}

console.log("\n=== Retry dispense ===");
console.log(JSON.stringify(body, null, 2));

const res = await fetch(`${API_BASE}/api/gas/retry-dispense`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const text = await res.text();
console.log("\nHTTP", res.status);
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}
