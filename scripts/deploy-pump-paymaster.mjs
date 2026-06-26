/**
 * Deploy PumpPaymaster to Monad Testnet using precompiled Foundry artifact.
 * Usage: node scripts/deploy-pump-paymaster.mjs
 * Requires: EVM_OPERATOR_PRIVATE_KEY, COLLECTOR_ADDRESS (or NEXT_PUBLIC_COLLECTOR_ADDRESS)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  getAddress,
  http,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const root = resolve(import.meta.dirname, "..");
const artifactPath = resolve(root, "contracts/out/PumpPaymaster.sol/PumpPaymaster.json");

function loadEnvFile(name) {
  const path = resolve(root, name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!val) continue;
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env.local");

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

const ENTRY_POINT = getAddress(
  process.env.ENTRY_POINT_ADDRESS ??
    process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS ??
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
);

function resolvePrivateKey() {
  const raw =
    process.env.EVM_OPERATOR_PRIVATE_KEY?.trim() ??
    process.env.OPERATOR_PRIVATE_KEY?.trim() ??
    process.env.DEPLOYER_PRIVATE_KEY?.trim();
  if (!raw) throw new Error("EVM_OPERATOR_PRIVATE_KEY missing");
  return raw.startsWith("0x") ? raw : `0x${raw}`;
}

function resolvePriceSigner(deployer) {
  const candidates = [
    process.env.PRICE_SIGNER_ADDRESS,
    process.env.COLLECTOR_ADDRESS,
    process.env.NEXT_PUBLIC_COLLECTOR_ADDRESS,
    deployer,
  ];
  for (const raw of candidates) {
    const trimmed = raw?.trim();
    if (trimmed && isAddress(trimmed)) return getAddress(trimmed);
  }
  throw new Error("PRICE_SIGNER / COLLECTOR address missing");
}

if (!existsSync(artifactPath)) {
  throw new Error(`Artifact not found: ${artifactPath}`);
}

const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const pk = resolvePrivateKey();
const account = privateKeyToAccount(pk);
const priceSigner = resolvePriceSigner(account.address);

const transport = http(monadTestnet.rpcUrls.default.http[0]);
const publicClient = createPublicClient({ chain: monadTestnet, transport });
const walletClient = createWalletClient({ chain: monadTestnet, transport, account });

console.log("Deployer:", account.address);
console.log("EntryPoint:", ENTRY_POINT);
console.log("PriceSigner:", priceSigner);
console.log("RPC:", monadTestnet.rpcUrls.default.http[0]);

const balance = await publicClient.getBalance({ address: account.address });
console.log("Balance:", balance.toString(), "wei");

if (balance === 0n) {
  throw new Error("Deployer wallet has 0 MON on Monad Testnet — fund via faucet first.");
}

const hash = await walletClient.deployContract({
  abi: artifact.abi,
  bytecode: artifact.bytecode.object,
  args: [ENTRY_POINT, priceSigner],
});

console.log("Tx:", hash);
const receipt = await publicClient.waitForTransactionReceipt({ hash });
const address = receipt.contractAddress;

if (!address) {
  throw new Error(`Deploy failed — no contract address in receipt (status ${receipt.status})`);
}

const code = await publicClient.getBytecode({ address });
if (!code || code === "0x") {
  throw new Error("Deployed address has no bytecode");
}

console.log("");
console.log("SUCCESS — PumpPaymaster deployed");
console.log("CONTRACT_ADDRESS=", address);
console.log("NETWORK=Monad Testnet (10143)");
console.log("");
console.log("Add to Vercel env:");
console.log(`NEXT_PUBLIC_PUMP_PAYMASTER_ADDRESS=${address}`);
console.log(`NEXT_PUBLIC_ENTRY_POINT_ADDRESS=${ENTRY_POINT}`);
console.log(`PRICE_SIGNER_ADDRESS=${priceSigner}`);
