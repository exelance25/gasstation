export type PaymentToken = "ETH" | "MON" | "BASE" | "SOL";

export type SupportedChain =
  | "ethereum"
  | "base"
  | "monad"
  | "solana"
  | "ethereum-sepolia"
  | "base-sepolia"
  | "monad-testnet"
  | "solana-devnet";

export type FeeQuoteRequest = {
  chain: SupportedChain;
  paymentToken: PaymentToken;
  gasEstimateWei: string;
  userAddress?: string;
};

export type PriceSourceSnapshot = {
  source: string;
  usd: number;
  fetchedAt: string;
};

export type FeeQuoteResponse = {
  quoteId: string;
  chain: SupportedChain;
  paymentToken: PaymentToken;
  nativeGasToken: PaymentToken;
  gasEstimateWei: string;
  paymentAmount: string;
  paymentAmountFormatted: number;
  nativeGasCostWei: string;
  gasCostUsd: number;
  protocolFeeBps: number;
  spreadBps: number;
  priceSources: PriceSourceSnapshot[];
  maxSourceSpreadBps: number;
  priceSource: string;
  expiresAt: string;
  conservative: boolean;
  signature: string | null;
  signerAddress: string | null;
};

export const PAYMENT_TOKENS: PaymentToken[] = ["ETH", "MON", "BASE", "SOL"];

export const PROTOCOL_FEE_BPS = 50;
export const SPREAD_BPS = 300;

export function nativeGasTokenForChain(chain: SupportedChain): PaymentToken {
  if (chain.startsWith("monad")) return "MON";
  if (chain.startsWith("solana")) return "SOL";
  return "ETH"; // ethereum + base native gas = ETH
}
