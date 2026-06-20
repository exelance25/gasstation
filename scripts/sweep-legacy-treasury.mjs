/**
 * Eski kasa (MetaMask) → yeni COLLECTOR_ADDRESS
 *
 * Kullanım (tek seferlik):
 *   LEGACY_EVM_PRIVATE_KEY=0x... node scripts/sweep-legacy-treasury.mjs
 *
 * LEGACY = eski kasa 0x1c841C9f93AF21a278C00C37851f44CC68A46eAD private key
 * (MetaMask'tan export — chat'e yapıştırmayın)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  formatUnits,
  getAddress,
  http,
  parseAbi,
  parseEther,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, sepolia } from "viem/chains";
import { defineChain } from "viem";

function loadEnvFile(name) {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");

const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);

const SEPOLIA_USDC = getAddress("0x1c7D4B196Cb0C7B4d1570db724C8a581A04De0e4");
const BASE_SEPOLIA_USDC = getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
const MONAD_USDC = getAddress("0x534b2f3A21130d7a60830c2Df862319e593943A3");

const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC ?? "https://testnet-rpc.monad.xyz"],
    },
  },
});

const GAS_RESERVE = {
  [sepolia.id]: parseEther("0.002"),
  [baseSepolia.id]: parseEther("0.0005"),
  [monadTestnet.id]: parseEther("0.05"),
};

const destinations = getAddress(
  process.env.COLLECTOR_ADDRESS ?? process.env.NEXT_PUBLIC_COLLECTOR_ADDRESS ?? "",
);

const legacyRaw = (process.env.LEGACY_EVM_PRIVATE_KEY ?? "").trim();
if (!legacyRaw || legacyRaw.length < 64) {
  console.error("LEGACY_EVM_PRIVATE_KEY gerekli (eski kasa private key).");
  console.error("Ornek: LEGACY_EVM_PRIVATE_KEY=0x... node scripts/sweep-legacy-treasury.mjs");
  process.exit(1);
}

const legacyKey = legacyRaw.startsWith("0x") ? legacyRaw : `0x${legacyRaw}`;
const account = privateKeyToAccount(legacyKey);

console.log("Kaynak (eski kasa):", account.address);
console.log("Hedef (yeni kasa):", destinations);

const chains = [
  {
    name: "Ethereum Sepolia",
    chain: sepolia,
    rpc: process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com",
    usdc: SEPOLIA_USDC,
  },
  {
    name: "Base Sepolia",
    chain: baseSepolia,
    rpc: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org",
    usdc: BASE_SEPOLIA_USDC,
  },
  {
    name: "Monad Testnet",
    chain: monadTestnet,
    rpc: process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC ?? "https://testnet-rpc.monad.xyz",
    usdc: MONAD_USDC,
  },
];

for (const { name, chain, rpc, usdc } of chains) {
  console.log(`\n=== ${name} ===`);
  const publicClient = createPublicClient({ chain, transport: http(rpc) });
  const walletClient = createWalletClient({ account, chain, transport: http(rpc) });

  const nativeBal = await publicClient.getBalance({ address: account.address });
  const usdcBal = await publicClient.readContract({
    address: usdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account.address],
  });

  console.log("Native:", formatEther(nativeBal), chain.nativeCurrency.symbol);
  console.log("USDC:", formatUnits(usdcBal, 6));

  if (usdcBal > 0n) {
    const hash = await walletClient.writeContract({
      address: usdc,
      abi: erc20Abi,
      functionName: "transfer",
      args: [destinations, usdcBal],
    });
    console.log("USDC transfer tx:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("USDC tamam.");
  }

  const reserve = GAS_RESERVE[chain.id] ?? parseEther("0.001");
  const nativeAfter = await publicClient.getBalance({ address: account.address });
  const sendAmount = nativeAfter > reserve ? nativeAfter - reserve : 0n;

  if (sendAmount > 0n) {
    const hash = await walletClient.sendTransaction({
      to: destinations,
      value: sendAmount,
    });
    console.log("Native transfer tx:", hash);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("Native tamam:", formatEther(sendAmount), chain.nativeCurrency.symbol);
  } else {
    console.log("Native transfer atlandi (yetersiz bakiye veya sadece reserve).");
  }
}

console.log("\nBitti. Solana (Phantom) tokenleri EVM adresine dogrudan gonderilemez.");
console.log("Phantom CKZZp... icin: Phantom uygulamasindan manuel gonderim veya ayri Solana kasa kullanin.");
