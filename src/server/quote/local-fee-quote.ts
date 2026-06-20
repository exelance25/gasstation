import { randomUUID } from "node:crypto";
import { getOracleTick } from "@/server/oracle/oracle-service";

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

export type LocalFeeQuoteRequest = {
  chain: SupportedChain;
  paymentToken: PaymentToken;
  gasEstimateWei: string;
  userAddress?: string;
};

export type LocalFeeQuoteResponse = {
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
  priceSources: { source: string; usd: number; fetchedAt: string }[];
  maxSourceSpreadBps: number;
  priceSource: string;
  expiresAt: string;
  conservative: boolean;
  signature: null;
  signerAddress: null;
};

const PROTOCOL_FEE_BPS = 50;
const SPREAD_BPS = 300;
const QUOTE_TTL_SEC = 120;

function nativeGasTokenForChain(chain: SupportedChain): PaymentToken {
  if (chain.startsWith("monad")) return "MON";
  if (chain.startsWith("solana")) return "SOL";
  return "ETH";
}

function usdFromTick(
  tick: Awaited<ReturnType<typeof getOracleTick>>,
  token: PaymentToken,
): number {
  switch (token) {
    case "ETH":
      return tick.ETH_Price;
    case "BASE":
      return tick.BASE_Price;
    case "MON":
      return tick.MON_Price;
    case "SOL":
      return tick.SOL_Price;
  }
}

/** Quote Engine kapalıyken oracle ile yerel quote (imzasız — dev/test) */
export async function buildLocalFeeQuote(
  req: LocalFeeQuoteRequest,
): Promise<LocalFeeQuoteResponse> {
  const gasWei = BigInt(req.gasEstimateWei);
  if (gasWei <= 0n) throw new Error("gasEstimateWei pozitif olmalı");

  const tick = await getOracleTick();
  const nativeGasToken = nativeGasTokenForChain(req.chain);
  const spreadMul = 1 + SPREAD_BPS / 10_000;

  const gasUsdPerUnit = usdFromTick(tick, nativeGasToken) * spreadMul;
  const paymentUsdPerUnit = usdFromTick(tick, req.paymentToken) / spreadMul;

  const nativeUnits = Number(gasWei) / 1e18;
  const gasCostUsd = nativeUnits * gasUsdPerUnit;
  const withProtocol = gasCostUsd * (1 + PROTOCOL_FEE_BPS / 10_000);
  const paymentAmountFloat = withProtocol / paymentUsdPerUnit;
  const paymentAmountWei = BigInt(Math.ceil(paymentAmountFloat * 1e18));

  return {
    quoteId: randomUUID(),
    chain: req.chain,
    paymentToken: req.paymentToken,
    nativeGasToken,
    gasEstimateWei: gasWei.toString(),
    paymentAmount: paymentAmountWei.toString(),
    paymentAmountFormatted: paymentAmountFloat,
    nativeGasCostWei: gasWei.toString(),
    gasCostUsd: withProtocol,
    protocolFeeBps: PROTOCOL_FEE_BPS,
    spreadBps: SPREAD_BPS,
    priceSources: [
      {
        source: String(tick.source),
        usd: paymentUsdPerUnit,
        fetchedAt: tick.updatedAt,
      },
    ],
    maxSourceSpreadBps: 0,
    priceSource: String(tick.source),
    expiresAt: new Date(Date.now() + QUOTE_TTL_SEC * 1000).toISOString(),
    conservative: true,
    signature: null,
    signerAddress: null,
  };
}
