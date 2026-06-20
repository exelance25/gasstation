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

export type FeeQuote = {
  quoteId: string;
  chain: SupportedChain;
  paymentToken: PaymentToken;
  nativeGasToken?: PaymentToken;
  gasEstimateWei: string;
  paymentAmount: string;
  paymentAmountFormatted: number;
  gasCostUsd?: number;
  expiresAt: string;
  signature: string | null;
  signerAddress: string | null;
  priceSource: string;
  maxSourceSpreadBps: number;
};

export type GetFeeQuoteParams = {
  chain: SupportedChain;
  paymentToken: PaymentToken;
  gasEstimateWei: bigint | string;
  userAddress?: string;
};

export type SettleFeeParams = {
  quote: FeeQuote;
  paymentTxHash: string;
  payerAddress: string;
  beneficiaryAddress: string;
};

export type SettleFeeResult = {
  settlementId: string;
  quoteId: string;
  status: string;
  paymentTxHash: string;
  deliveryTxHash: string | null;
  beneficiaryAddress: string;
  gasDeliveredWei: string;
  message: string;
};

export type GasStationFeeConfig = {
  /** Quote Engine veya Next.js proxy */
  apiUrl: string;
  /** Settlement Engine (opsiyonel — varsayılan :4200) */
  settlementUrl?: string;
  apiKey?: string;
};
