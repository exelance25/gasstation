import { defineChain, type Address } from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { clientEnv } from "@/config/client-env";

/** Monad Mainnet */
export const monadMainnet = defineChain({
  id: 143,
  name: "Monad Mainnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [clientEnv.NEXT_PUBLIC_MONAD_MAINNET_RPC ?? "https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "MonadVision", url: "https://monadvision.com" },
  },
});

/** Monad Testnet */
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [clientEnv.NEXT_PUBLIC_MONAD_TESTNET_RPC] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadvision.com" },
  },
  testnet: true,
});

/** Arc Testnet — Circle USDC-native L1 (chain ID 5042002) */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: {
      http: [clientEnv.NEXT_PUBLIC_ARC_TESTNET_RPC ?? "https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
});

/** Eski paymaster kontratının deploy edildiği ağ (protokol evrensel; bu yalnızca legacy RPC) */
export const paymentChain =
  clientEnv.NEXT_PUBLIC_APP_ENV === "mainnet" ? monadMainnet : monadTestnet;

export const PAYMENT_CHAIN_ID = paymentChain.id;
export const PAYMENT_CHAIN_NAME = paymentChain.name;

function buildUsdcByChain(): Record<number, Address> {
  const map: Record<number, Address> = {
    [monadTestnet.id]: "0x534b2f3A21130d7a60830c2Df862319e593943A3",
    [monadMainnet.id]: "0x754704Bc059F8C67012fEd69BC8A327a5aafb603",
    [baseSepolia.id]: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    [base.id]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    [mainnet.id]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    [sepolia.id]: "0x1c7D4B196Cb0C7B4d1570db724C8a581A04De0e4",
  };
  const arcUsdc = clientEnv.NEXT_PUBLIC_ARC_USDC_ADDRESS?.trim();
  if (arcUsdc?.startsWith("0x") && arcUsdc.length === 42) {
    map[arcTestnet.id] = arcUsdc as Address;
  }
  return map;
}

/** Circle USDC — desteklenen EVM ağları */
export const USDC_BY_CHAIN: Record<number, Address> = buildUsdcByChain();

/** Evrensel USDC depozit — eşit ağırlıklı; Monad öncelikli değil */
export const DEPOSIT_EVM_CHAIN_IDS: readonly number[] = [
  ...new Set(
    clientEnv.NEXT_PUBLIC_APP_ENV === "mainnet"
      ? [mainnet.id, base.id, monadMainnet.id]
      : [sepolia.id, mainnet.id, baseSepolia.id, monadTestnet.id, arcTestnet.id],
  ),
].filter((chainId) => chainId in USDC_BY_CHAIN);

const CHAIN_DISPLAY_NAMES: Record<number, string> = {
  [mainnet.id]: "Ethereum",
  [base.id]: "Base",
  [baseSepolia.id]: "Base Sepolia",
  [monadMainnet.id]: "Monad",
  [monadTestnet.id]: "Monad Testnet",
  [arcTestnet.id]: "Arc",
  [sepolia.id]: "Ethereum Sepolia",
};

export const USDC_DECIMALS = 6;

/** Wagmi zincir listesi — Ethereum önce; protokol tek ağa bağlı değil */
export const supportedEvmChains = [
  mainnet,
  sepolia,
  base,
  baseSepolia,
  monadMainnet,
  monadTestnet,
  arcTestnet,
] as const;

export function isUsdcDepositChain(chainId: number | undefined): chainId is number {
  return chainId !== undefined && chainId in USDC_BY_CHAIN;
}

export function getUsdcAddress(chainId: number): Address | null {
  const custom = clientEnv.NEXT_PUBLIC_MONAD_USDC_ADDRESS?.trim();
  if (
    (chainId === monadTestnet.id || chainId === monadMainnet.id) &&
    custom?.startsWith("0x") &&
    custom.length === 42
  ) {
    return custom as Address;
  }
  return USDC_BY_CHAIN[chainId] ?? null;
}

export function getChainDisplayName(chainId: number | undefined): string {
  if (chainId === undefined) return "Bağlı değil";
  return CHAIN_DISPLAY_NAMES[chainId] ?? `Chain ${chainId}`;
}

export function getPaymentRpcUrl(): string {
  return paymentChain.id === 143
    ? (clientEnv.NEXT_PUBLIC_MONAD_MAINNET_RPC ?? "https://rpc.monad.xyz")
    : clientEnv.NEXT_PUBLIC_MONAD_TESTNET_RPC;
}

const WC_PLACEHOLDERS = new Set([
  "",
  "replace_wallet_connect_key",
  "your_walletconnect_project_id",
  "4a7d6e5b8c9a0f1e2d3c4b5a6f7e8d9c",
]);
const wcProjectId = clientEnv.NEXT_PUBLIC_WC_PROJECT_ID?.trim() ?? "";

/** Gerçek Reown projesi + allowlist + NEXT_PUBLIC_WC_ENABLED=true gerekir */
export const isWalletConnectReady = Boolean(
  clientEnv.NEXT_PUBLIC_WC_ENABLED &&
    wcProjectId &&
    !WC_PLACEHOLDERS.has(wcProjectId) &&
    /^[a-f0-9]{32}$/i.test(wcProjectId),
);

/** Standart ERC-20 — denetlenmiş minimal ABI (sunucu + istemci güvenli) */
export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;
