/**
 * MON gas teslimat testi — operatör → test alıcı (Monad Testnet)
 * Kullanım: node scripts/test-dispense-mon.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  fallback,
  formatEther,
  http,
  isAddress,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain, parseAbi } from "viem";

/**
 * Monad test alıcısı — Hardhat #1 (0x7099…) bu ağda kontrat; EOA kullanın.
 * .env.local: TEST_GAS_RECIPIENT=0x… ile override edilebilir.
 */
const TEST_RECIPIENT =
  process.env.TEST_GAS_RECIPIENT ?? "0xd815dA511bC7D687A0909B47E1e78785D658293A";

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
  blockExplorers: {
    default: { name: "MonadVision", url: "https://testnet.monadvision.com" },
  },
});

const MONAD_USDC = "0x534b2f3A21130d7a60830c2Df862319e593943A3";
const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);

const pk = (process.env.EVM_OPERATOR_PRIVATE_KEY ?? "").trim();
if (!pk || pk.length < 64) {
  console.error("FAIL: EVM_OPERATOR_PRIVATE_KEY yok");
  process.exit(1);
}

if (!isAddress(TEST_RECIPIENT)) {
  console.error("FAIL: Geçersiz test alıcı");
  process.exit(1);
}

const MONAD_RPC_FALLBACKS = [
  process.env.MONAD_RPC_PRIVATE_URL,
  process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC,
  "https://rpc.ankr.com/monad_testnet",
  "https://monad-testnet.drpc.org",
  "https://rpc-testnet.monadinfra.com",
  "https://testnet-rpc.monad.xyz",
].filter((u) => u && !u.includes("your-optional-key"));

const monadRpcUrls = [...new Set(MONAD_RPC_FALLBACKS)];
const monadTransport = fallback(monadRpcUrls.map((url) => http(url)));

const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
console.log("RPC hatları:", monadRpcUrls.join(" → "));
const publicClient = createPublicClient({ chain: monadTestnet, transport: monadTransport });
const walletClient = createWalletClient({ account, chain: monadTestnet, transport: monadTransport });

console.log("=== PUMPSTATION MON GAS TESLİMAT TESTİ ===\n");
console.log("Operatör:", account.address);
console.log("Alıcı (test):", TEST_RECIPIENT);
console.log("Ağ: Monad Testnet (10143)\n");

const operatorMon = await publicClient.getBalance({ address: account.address });
const recipientBefore = await publicClient.getBalance({ address: TEST_RECIPIENT });

console.log("Operatör MON:", formatEther(operatorMon));
console.log("Alıcı MON (önce):", formatEther(recipientBefore));

let usdcBal = 0n;
try {
  usdcBal = await publicClient.readContract({
    address: MONAD_USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });
  console.log("Operatör USDC (Monad):", Number(usdcBal) / 1e6);
} catch (e) {
  console.log("Operatör USDC okunamadı:", e.shortMessage ?? e.message);
}

const MONAD_RESERVE = parseEther("10");
const gasAmount = 0.001;
const valueWei = parseEther(String(gasAmount));
const minForNormalSend = MONAD_RESERVE + valueWei;

if (operatorMon < valueWei) {
  console.error(`\nFAIL: Operatörde en az ${gasAmount} MON gerekli`);
  process.exit(1);
}

if (operatorMon < minForNormalSend) {
  console.log(
    `\n⚠ Operatör bakiyesi (${formatEther(operatorMon)} MON) Monad 10 MON reserve altında.`,
  );
  console.log("   Normal dış transfer için faucet ile en az ~10.001 MON gerekli.");
  console.log("   Alternatif: node scripts/test-dispense-mon-emptying.mjs (tek seferlik sweep)\n");
  process.exit(1);
}

const recipientCode = await publicClient.getCode({ address: TEST_RECIPIENT });
if (recipientCode && recipientCode !== "0x") {
  console.error(`\nFAIL: Alıcı EOA değil (kontrat kodu var) — ${TEST_RECIPIENT}`);
  process.exit(1);
}

const gasPrice = await publicClient.getGasPrice();
console.log(`\n→ ${gasAmount} MON gönderiliyor...`);

const hash = await walletClient.sendTransaction({
  to: TEST_RECIPIENT,
  value: valueWei,
  gas: 50_000n,
  gasPrice,
  type: "legacy",
});

console.log("Tx hash:", hash);
console.log("Explorer:", `https://testnet.monadvision.com/tx/${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
const recipientAfter = await publicClient.getBalance({ address: TEST_RECIPIENT });

console.log("\nReceipt status:", receipt.status);
console.log("Alıcı MON (sonra):", formatEther(recipientAfter));
console.log("Fark:", formatEther(recipientAfter - recipientBefore), "MON");

if (receipt.status !== "success") {
  console.error("\nFAIL: Tx reverted");
  process.exit(1);
}

console.log("\nPASS: MON gas teslimatı başarılı");

if (usdcBal >= 5_000_000n) {
  console.log("\n[Not] Operatörde USDC var — tam ATEŞLE akışı için Phantom ile depozit test edilebilir.");
} else {
  console.log("\n[Not] Tam dispense API testi için Monad Testnet USDC depozit gerekli (Phantom cüzdan).");
}
