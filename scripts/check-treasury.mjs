/**
 * Kasa durumu — MON likiditesi + collector USDC (tüm depozit ağları)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, formatEther, formatUnits, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, mainnet } from "viem/chains";
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

const collector = process.env.COLLECTOR_ADDRESS ?? process.env.NEXT_PUBLIC_COLLECTOR_ADDRESS;
const pk = (process.env.EVM_OPERATOR_PRIVATE_KEY ?? "").trim();
const operator = pk ? privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`).address : null;

const monad = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC ?? "https://testnet-rpc.monad.xyz"],
    },
  },
});

const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)"]);
const chains = [
  { name: "Monad Testnet", chain: monad, usdc: "0x534b2f3A21130d7a60830c2Df862319e593943A3" },
  {
    name: "Base Sepolia",
    chain: baseSepolia,
    usdc: process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS ?? "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
];

console.log("=== TREASURY STATUS ===\n");
console.log("Collector:", collector);
console.log("Operatör:", operator ?? "(yok)");

if (operator) {
  const pc = createPublicClient({
    chain: monad,
    transport: http(monad.rpcUrls.default.http[0]),
  });
  const mon = await pc.getBalance({ address: operator });
  console.log("\nOperatör MON:", formatEther(mon));
  if (mon < 10n * 10n ** 18n) {
    console.log("  ⚠ Monad reserve için ≥10 MON önerilir");
  }
}

console.log("\nCollector USDC:");
for (const c of chains) {
  try {
    const pc = createPublicClient({
      chain: c.chain,
      transport: http(c.chain.rpcUrls.default.http[0]),
    });
    const bal = await pc.readContract({
      address: c.usdc,
      abi: erc20,
      functionName: "balanceOf",
      args: [collector],
    });
    console.log(`  ${c.name}: ${formatUnits(bal, 6)} USDC`);
  } catch (e) {
    console.log(`  ${c.name}: okunamadı (${e.shortMessage ?? e.message})`);
  }
}

console.log("\nE2E test: Phantom → $5 USDC → collector, sonra:");
console.log("  npm run test:e2e-dispense");
console.log("veya UI: http://localhost:3000/yakit-al");
