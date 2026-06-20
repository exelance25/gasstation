/**
 * GASSTATION protokol ücretleri — tek kaynak.
 * Marketplace ve SDK bu değerlerle uyumlu tutulmalı.
 */
/** Paket / manuel dispense protokol marjı */
export const PROTOCOL_PROFIT_RATE = 0.1;

/** Ağ / relay payı (USD) */
export const NETWORK_FEE_USD = 0.02;

export function getEffectiveNetworkFeeUsd(): number {
  return process.env.NEXT_PUBLIC_APP_ENV === "mainnet" ? NETWORK_FEE_USD : 0;
}

export function getEffectiveProtocolProfitRate(): number {
  return process.env.NEXT_PUBLIC_APP_ENV === "mainnet" ? PROTOCOL_PROFIT_RATE : 0;
}

/** Paymaster otomatik fee çarpanı — on-chain feeMultiplier / 10000 */
export const PAYMASTER_FEE_BPS = 50; // 0.5%
export const PAYMASTER_FEE_MULTIPLIER = 10000n + BigInt(PAYMASTER_FEE_BPS);

/** Oracle konservatif buffer — kasa koruması (ödeme tarafı) */
export const ORACLE_CONSERVATIVE_BUFFER = 0.05;

/** İmzalı paymaster quote geçerlilik süresi */
export const PAYMASTER_QUOTE_TTL_SEC = 120;
