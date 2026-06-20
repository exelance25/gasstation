export type ChainId = "ethereum" | "solana" | "monad";

export type CrossChainPaymentIntent = {
  fromChain: ChainId;
  toChain: ChainId;
  amount: string;
  recipient: string;
};

export type PaymentIntent = CrossChainPaymentIntent & {
  id: string;
  status: "draft" | "submitted" | "settled";
  fiatAmount: number;
  currency: string;
};

export function buildPaymentIntent(intent: CrossChainPaymentIntent) {
  return {
    ...intent,
    id: crypto.randomUUID(),
    status: "draft" as const
  };
}

export function createPaymentIntent(input: {
  amount: number;
  currency: string;
  recipient: string;
  sourceChain: ChainId;
  targetChain: ChainId;
}): PaymentIntent {
  return {
    id: crypto.randomUUID(),
    status: "draft",
    fiatAmount: input.amount,
    currency: input.currency,
    recipient: input.recipient,
    fromChain: input.sourceChain,
    toChain: input.targetChain,
    amount: String(input.amount)
  };
}
