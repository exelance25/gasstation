/**
 * Monad emptying tx — reserve altı bakiyede tek seferlik sweep testi.
 * k blok bekler, sonra test alıcısına (balance - gas) gönderir.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

const TEST_RECIPIENT =
  process.env.TEST_GAS_RECIPIENT ?? "0xd815dA511bC7D687A0909B47E1e78785D658293A";
const K_BLOCK_WAIT_MS = 5000;
/** Monad basit transfer ~21.165 gas; 21k limit OOG revert verir */
const GAS_LIMIT = 50_000n;

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
const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
const rpc = monadTestnet.rpcUrls.default.http[0];
const publicClient = createPublicClient({ chain: monadTestnet, transport: http(rpc) });
const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http(rpc) });

console.log("=== MONAD EMPTYING SWEEP TEST ===\n");
console.log("Operatör:", account.address);
console.log("Alıcı:", TEST_RECIPIENT);
console.log(`k-blok penceresi için ${K_BLOCK_WAIT_MS / 1000}s bekleniyor...\n`);

await new Promise((r) => setTimeout(r, K_BLOCK_WAIT_MS));

const balance = await publicClient.getBalance({ address: account.address });
const recipientBefore = await publicClient.getBalance({ address: TEST_RECIPIENT });
console.log("Operatör MON:", formatEther(balance));
console.log("Alıcı MON (önce):", formatEther(recipientBefore));

const gasPrice = await publicClient.getGasPrice();
const gasCost = gasPrice * GAS_LIMIT;
const sendValue = balance > gasCost ? balance - gasCost : 0n;

if (sendValue <= 0n) {
  console.error("FAIL: Gas için yeterli MON yok");
  process.exit(1);
}

console.log(`\n→ Emptying sweep: ${formatEther(sendValue)} MON (gas limit ${GAS_LIMIT})`);

const hash = await walletClient.sendTransaction({
  to: TEST_RECIPIENT,
  value: sendValue,
  gas: GAS_LIMIT,
});

console.log("Tx:", hash);
console.log("Explorer:", `https://testnet.monadvision.com/tx/${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
const recipientAfter = await publicClient.getBalance({ address: TEST_RECIPIENT });

console.log("\nReceipt:", receipt.status);
console.log("Gas used:", receipt.gasUsed.toString());
console.log("Alıcı MON (sonra):", formatEther(recipientAfter));
console.log("Alıcı artış:", formatEther(recipientAfter - recipientBefore), "MON");

if (receipt.status !== "success") {
  console.error("\nFAIL");
  process.exit(1);
}

console.log("\nPASS: Emptying MON teslimatı başarılı");
console.log("\n[Üretim] Operatör kasasına en az 10 MON + paket gas tutulmalı (reserve kuralı).");
