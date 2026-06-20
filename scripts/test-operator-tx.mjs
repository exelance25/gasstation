/**
 * Operatör kasası — Monad Testnet üzerinde küçük native gas tx testi.
 * Kullanım: node scripts/test-operator-tx.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

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

const pk = (process.env.EVM_OPERATOR_PRIVATE_KEY ?? "").trim();
const recipient = (process.env.ADMIN_WALLET_ADDRESS ?? process.env.NEXT_PUBLIC_COLLECTOR_ADDRESS ?? "").trim();

if (!pk || pk.length < 64) {
  console.error("FAIL: EVM_OPERATOR_PRIVATE_KEY yok");
  process.exit(1);
}
if (!recipient?.startsWith("0x")) {
  console.error("FAIL: ADMIN_WALLET_ADDRESS veya COLLECTOR_ADDRESS yok");
  process.exit(1);
}

const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
const rpc = monadTestnet.rpcUrls.default.http[0];
const publicClient = createPublicClient({ chain: monadTestnet, transport: http(rpc) });
const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http(rpc) });

const amount = parseEther("0.001");

console.log("Operatör:", account.address);
console.log("Hedef:", recipient);
console.log("Ağ: Monad Testnet");
console.log("Miktar: 0.001 MON\n");

const balance = await publicClient.getBalance({ address: account.address });
console.log("Operatör bakiye:", formatEther(balance), "MON");

if (balance < amount) {
  console.error("FAIL: Operatör bakiyesi yetersiz — faucet gerekli");
  process.exit(1);
}

const hash = await walletClient.sendTransaction({
  to: recipient,
  value: amount,
});

console.log("Tx gönderildi:", hash);
console.log("Explorer: https://testnet.monadvision.com/tx/" + hash);

const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
console.log("Durum:", receipt.status);
console.log(receipt.status === "success" ? "PASS: Operatör tx başarılı" : "FAIL: Tx reverted");
