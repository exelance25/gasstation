/**
 * Mainnet öncesi kontrol listesi — env, RPC, operatör bakiyeleri
 * Kullanım: node scripts/preflight-mainnet.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, formatEther, formatUnits, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, mainnet, sepolia } from "viem/chains";
import { defineChain } from "viem";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
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

const checks = [];
function ok(name, detail) {
  checks.push({ name, pass: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail) {
  checks.push({ name, pass: false, detail });
  console.log(`✗ ${name} — ${detail}`);
}

console.log("=== GASSTATION PREFLIGHT ===\n");
console.log("APP_ENV:", process.env.NEXT_PUBLIC_APP_ENV ?? "(unset)");

const wc = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";
if (/^[a-f0-9]{32}$/i.test(wc) && !wc.includes("your_wallet")) {
  ok("WalletConnect project id");
} else {
  fail("WalletConnect project id", "gerçek NEXT_PUBLIC_WC_PROJECT_ID gerekli");
}

const collector =
  process.env.COLLECTOR_ADDRESS ?? process.env.NEXT_PUBLIC_COLLECTOR_ADDRESS;
if (collector?.startsWith("0x") && collector.length === 42) {
  ok("Collector address", collector.slice(0, 10) + "…");
} else {
  fail("Collector address", "COLLECTOR_ADDRESS eksik");
}

const pk = (process.env.EVM_OPERATOR_PRIVATE_KEY ?? "").trim();
if (pk.length >= 64) {
  ok("EVM operator key");
} else {
  fail("EVM operator key", "EVM_OPERATOR_PRIVATE_KEY eksik");
}

const sol = (process.env.SOLANA_PRIVATE_KEY ?? "").trim();
if (sol.length >= 32) ok("Solana operator key");
else fail("Solana operator key", "SOLANA_PRIVATE_KEY eksik (SOL teslimatı için)");

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

if (pk.length >= 64) {
  const acc = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
  const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)"]);
  const chains = [
    { label: "Monad MON", chain: monadTestnet, native: true },
    { label: "Sepolia ETH", chain: sepolia, native: true },
    { label: "Base Sepolia ETH", chain: base, native: true },
  ];

  for (const c of chains) {
    try {
      const rpc = c.chain.rpcUrls.default.http[0];
      const pc = createPublicClient({ chain: c.chain, transport: http(rpc) });
      const bal = await pc.getBalance({ address: acc.address });
      const formatted = formatEther(bal);
      if (Number(formatted) > 0.001) ok(c.label, formatted);
      else fail(c.label, `düşük bakiye (${formatted})`);
    } catch (e) {
      fail(c.label, e.shortMessage ?? e.message);
    }
  }

  try {
    const rpc = monadTestnet.rpcUrls.default.http[0];
    const pc = createPublicClient({ chain: monadTestnet, transport: http(rpc) });
    const usdc = "0x534b2f3A21130d7a60830c2Df862319e593943A3";
    const bal = await pc.readContract({
      address: usdc,
      abi: erc20,
      functionName: "balanceOf",
      args: [acc.address],
    });
    ok("Operatör USDC (Monad)", formatUnits(bal, 6));
  } catch (e) {
    fail("Operatör USDC (Monad)", e.shortMessage ?? e.message);
  }

  const monBal = await createPublicClient({
    chain: monadTestnet,
    transport: http(monadTestnet.rpcUrls.default.http[0]),
  }).getBalance({ address: acc.address });
  if (monBal >= 10n * 10n ** 18n) {
    ok("Monad reserve (≥10 MON)", formatEther(monBal));
  } else {
    fail("Monad reserve", `operatör ${formatEther(monBal)} MON — teslimat için ≥10 MON önerilir`);
  }
}

const passed = checks.filter((c) => c.pass).length;
console.log(`\n${passed}/${checks.length} kontrol geçti`);
process.exit(passed === checks.length ? 0 : 1);
