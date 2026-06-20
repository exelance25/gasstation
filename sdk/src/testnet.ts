import { defineChain } from "viem";
import { baseSepolia } from "viem/chains";
import type { Address } from "viem";

/** ERC-4337 EntryPoint v0.6 — Base Sepolia */
export const ENTRY_POINT_V06 =
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" as const satisfies Address;

/** Circle USDC — Base Sepolia (resmi test token) */
export const BASE_SEPOLIA_USDC =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const satisfies Address;

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
});

export type PumpTestnetConfig = {
  /** Kaynak ödeme ağı — Base Sepolia */
  sourceChain: typeof baseSepolia;
  /** Gas teslim ağı — Monad Testnet */
  targetChain: typeof monadTestnet;
  entryPointAddress: Address;
  usdcAddress: Address;
  rpcUrl: string;
  monadRpcUrl: string;
  relayerSubmitUrl: string;
  paymasterAddress?: Address;
};

/** GitHub / dApp testnet varsayılanları — deploy sonrası paymasterAddress doldurun */
export function getTestnetDefaults(paymasterAddress?: Address): PumpTestnetConfig {
  return {
    sourceChain: baseSepolia,
    targetChain: monadTestnet,
    entryPointAddress: ENTRY_POINT_V06,
    usdcAddress: BASE_SEPOLIA_USDC,
    rpcUrl: "https://sepolia.base.org",
    monadRpcUrl: "https://testnet-rpc.monad.xyz",
    relayerSubmitUrl: "/api/relay/submit",
    paymasterAddress,
  };
}
