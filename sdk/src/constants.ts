/** Protokol ücretleri — ana uygulama config/protocol-fees.ts ile senkron */

export const PROTOCOL_PROFIT_RATE = 0.1;

export const NETWORK_FEE_USD = 0.02;

export const ORACLE_CONSERVATIVE_BUFFER = 0.05;

export const PAYMASTER_FEE_BPS = 50;

export const PAYMASTER_FEE_MULTIPLIER = 10000n + BigInt(PAYMASTER_FEE_BPS);

export const PAYMASTER_QUOTE_TTL_SEC = 120;

/** Testnet demo paketleri (ana uygulama serbest miktar kullanır) */
export const TESTNET_AMOUNT_OPTIONS = [0.05, 0.1, 0.2] as const;

export type PricingEnv = "testnet" | "mainnet";

export function getEffectiveNetworkFeeUsd(env: PricingEnv = "testnet"): number {
  return env === "mainnet" ? NETWORK_FEE_USD : 0;
}

export function getEffectiveProtocolProfitRate(env: PricingEnv = "testnet"): number {
  return env === "mainnet" ? PROTOCOL_PROFIT_RATE : 0;
}
