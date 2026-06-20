/**
 * Gas tankı + operatör doğrulama
 * node scripts/smoke-gas-pipeline.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, formatEther, formatUnits, getAddress, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia, sepolia } from "viem/chains";
import { defineChain } from "viem";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
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
}

loadEnv();

const collector = process.env.COLLECTOR_ADDRESS ?? process.env.NEXT_PUBLIC_COLLECTOR_ADDRESS;
const pk = (process.env.EVM_OPERATOR_PRIVATE_KEY ?? "").trim();
const key = pk.startsWith("0x") ? pk : pk ? `0x${pk}` : "";
const operator = key ? privateKeyToAccount(key).address : null;

console.log("=== GASSTATION SMOKE ===");
console.log("Collector:", collector);
console.log("Operator:", operator);
console.log("Match:", operator && collector && operator.toLowerCase() === collector.toLowerCase());

const monad = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.MONAD_RPC_PRIVATE_URL,
        process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC,
        "https://testnet-rpc.monad.xyz",
      ].filter(Boolean),
    },
  },
});

const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)"]);
const usdcSepolia = getAddress("0x1c7D4B196Cb0C7B4d1570db724C8a581A04De0e4");

async function row(label, chain, rpc, usdc) {
  const c = createPublicClient({ chain, transport: http(rpc) });
  const addr = getAddress(collector);
  const native = await c.getBalance({ address: addr });
  let usdcBal = 0n;
  if (usdc) {
    usdcBal = await c.readContract({ address: usdc, abi: erc20, functionName: "balanceOf", args: [addr] });
  }
  console.log(`${label}: native=${formatEther(native)} USDC=${formatUnits(usdcBal, 6)}`);
}

if (collector) {
  await row("Sepolia", sepolia, process.env.NEXT_PUBLIC_ETH_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com", usdcSepolia);
  await row("Base Sepolia", baseSepolia, process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ?? "https://sepolia.base.org", getAddress("0x036CbD53842c5426634e7929541eC2318f3dCF7e"));
  await row("Monad", monad, monad.rpcUrls.default.http[0], getAddress("0x534b2f3A21130d7a60830c2Df862319e593943A3"));
}

try {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api$/, "") ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/gas/precheck`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetAsset: "ETH",
      packageAmount: 0.05,
      targetAddress: collector ?? "0x0000000000000000000000000000000000000001",
    }),
  });
  const body = await res.json();
  console.log("Precheck ETH 0.05$:", res.status, body);
} catch (e) {
  console.log("Precheck skip (sunucu kapalı?):", e.message);
}
