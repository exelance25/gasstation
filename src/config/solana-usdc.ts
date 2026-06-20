import { clientEnv } from "@/config/client-env";

/** Idempotency / API — EVM chainId yerine Solana küme kodları */
export const SOLANA_MAINNET_DEPOSIT_ID = 900_000;
export const SOLANA_DEVNET_DEPOSIT_ID = 900_001;

/** Circle USDC SPL mint */
export const SOLANA_USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const SOLANA_USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export type SolanaCluster = "mainnet-beta" | "devnet";

export function isMainnetAppEnv(): boolean {
  return clientEnv.NEXT_PUBLIC_APP_ENV === "mainnet";
}

export function getSolanaCluster(): SolanaCluster {
  return isMainnetAppEnv() ? "mainnet-beta" : "devnet";
}

export function getSolanaDepositChainId(): number {
  return isMainnetAppEnv() ? SOLANA_MAINNET_DEPOSIT_ID : SOLANA_DEVNET_DEPOSIT_ID;
}

export function getSolanaRpcUrl(): string {
  return isMainnetAppEnv()
    ? (clientEnv.NEXT_PUBLIC_SOLANA_MAINNET_RPC ?? "https://api.mainnet-beta.solana.com")
    : (clientEnv.NEXT_PUBLIC_SOLANA_DEVNET_RPC ?? "https://api.devnet.solana.com");
}

export function getSolanaUsdcMint(): string {
  const custom = process.env.NEXT_PUBLIC_SOLANA_USDC_MINT?.trim();
  if (custom && custom.length >= 32) return custom;
  return isMainnetAppEnv() ? SOLANA_USDC_MINT_MAINNET : SOLANA_USDC_MINT_DEVNET;
}

export function getSolanaCollectorAddress(): string | null {
  const addr =
    process.env.SOLANA_COLLECTOR_ADDRESS?.trim() ??
    clientEnv.NEXT_PUBLIC_SOLANA_VAULT_ADDRESS?.trim();
  if (!addr || addr.length < 32) return null;
  return addr;
}

export function isSolanaDepositConfigured(): boolean {
  return Boolean(getSolanaCollectorAddress() && getSolanaUsdcMint());
}
