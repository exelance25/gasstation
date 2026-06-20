export type SettlementStatus =
  | "PENDING"
  | "PAYMENT_VERIFIED"
  | "GAS_DELIVERED"
  | "FAILED";

export type SettleFeeRequest = {
  quoteId: string;
  chain: string;
  paymentToken: string;
  gasEstimateWei: string;
  paymentAmount: string;
  expiresAt: string;
  signature: string;
  paymentTxHash: string;
  payerAddress: string;
  beneficiaryAddress: string;
};

export type SettleFeeResponse = {
  settlementId: string;
  quoteId: string;
  status: SettlementStatus;
  paymentTxHash: string;
  deliveryTxHash: string | null;
  beneficiaryAddress: string;
  gasDeliveredWei: string;
  message: string;
};

export type SponsorshipPrepareRequest = {
  userAddress: string;
  chainId: number;
  intentId: string;
  gasEstimateWei?: string;
  paymentToken?: string;
};

export type SponsorshipPrepareResponse = {
  sponsorshipId: string;
  status: "quote_ready";
  quote: unknown;
  treasuryAddress: string | null;
  message: string;
};
