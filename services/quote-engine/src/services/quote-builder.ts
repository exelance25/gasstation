import { randomUUID } from "node:crypto";
import type { FeeQuoteRequest, FeeQuoteResponse } from "../types/quote.js";
import {
  PROTOCOL_FEE_BPS,
  SPREAD_BPS,
  nativeGasTokenForChain,
} from "../types/quote.js";
import { getEnv } from "../config/env.js";
import { aggregateTokenUsd } from "./price-sources/aggregate.js";
import { getSignerAddress, signFeeQuote } from "./quote-signer.js";

/** Katman A — çok kaynaklı fiyat + arbitraj koruması + imzalı quote */
export async function buildFeeQuote(req: FeeQuoteRequest): Promise<FeeQuoteResponse> {
  const gasWei = BigInt(req.gasEstimateWei);
  if (gasWei <= 0n) throw new Error("gasEstimateWei pozitif olmalı");

  const nativeGasToken = nativeGasTokenForChain(req.chain);

  const [gasTokenPrice, paymentTokenPrice] = await Promise.all([
    aggregateTokenUsd(nativeGasToken),
    aggregateTokenUsd(req.paymentToken),
  ]);

  if (gasTokenPrice.rejected) {
    throw new Error(gasTokenPrice.rejectReason ?? "Gas token fiyatı güvenilir değil");
  }
  if (paymentTokenPrice.rejected) {
    throw new Error(paymentTokenPrice.rejectReason ?? "Ödeme token fiyatı güvenilir değil");
  }

  const spreadMul = 1 + SPREAD_BPS / 10_000;
  const gasUsdPerUnit = gasTokenPrice.conservativeUsd * spreadMul;
  const paymentUsdPerUnit = paymentTokenPrice.aggressiveUsd / spreadMul;

  const nativeUnits = Number(gasWei) / 1e18;
  const gasCostUsd = nativeUnits * gasUsdPerUnit;
  const withProtocol = gasCostUsd * (1 + PROTOCOL_FEE_BPS / 10_000);
  const paymentAmountFloat = withProtocol / paymentUsdPerUnit;

  const paymentAmountWei = BigInt(
    Math.ceil(paymentAmountFloat * 1e18),
  );

  const ttlSec = getEnv().QUOTE_TTL_SEC;
  const expiresAt = new Date(Date.now() + ttlSec * 1000).toISOString();
  const quoteId = randomUUID();

  const allSources = [...gasTokenPrice.sources, ...paymentTokenPrice.sources];
  const maxSpread = Math.max(
    gasTokenPrice.maxSpreadBps,
    paymentTokenPrice.maxSpreadBps,
  );

  const signature = await signFeeQuote({
    quoteId,
    chain: req.chain,
    paymentToken: req.paymentToken,
    gasEstimateWei: gasWei.toString(),
    paymentAmount: paymentAmountWei.toString(),
    expiresAt,
  });

  return {
    quoteId,
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
    priceSources: allSources,
    maxSourceSpreadBps: maxSpread,
    priceSource: allSources.map((s) => s.source).join("+"),
    expiresAt,
    conservative: true,
    signature,
    signerAddress: getSignerAddress(),
  };
}
