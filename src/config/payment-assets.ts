/** Kasamız küçük — planlanan tek işlem aralığı (USD) */
export const MIN_ORDER_USD = 1;
export const MAX_ORDER_USD = 50;

/** Testnet / dev: çok küçük miktarlarla E2E test */
export function getMinOrderUsd(): number {
  return process.env.NEXT_PUBLIC_APP_ENV === "mainnet" ? MIN_ORDER_USD : 0;
}

export const SUPPORTED_PAY_SYMBOLS = ["ETH", "BASE", "MON", "SOL", "USDC"] as const;
export type PaySymbol = (typeof SUPPORTED_PAY_SYMBOLS)[number];

export const PAY_SYMBOL_LABEL: Record<PaySymbol, string> = {
  ETH: "ETH",
  BASE: "BASE",
  MON: "MON",
  SOL: "SOL",
  USDC: "USDC",
};
