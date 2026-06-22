import "server-only";

import { randomUUID } from "node:crypto";
import { formatEther } from "viem";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import { computePackageAccounting, getAssetUsdPrice } from "@/lib/treasury-accounting";
import { getOracleTick } from "@/server/oracle/oracle-service";
import { assessDeliveryLiquidity } from "@/server/liquidity/liquidity-engine";

export type QuotePaymentToken = "USDC" | "MON" | "BASE" | "ETH" | "DAI";

export type GasQuoterRequest = {
  deliveryAsset: GasDeliveryAsset;
  paymentToken: QuotePaymentToken;
  gasEstimateWei: string;
  depositChainId?: number;
};

export type GasQuoterResponse = {
  quoteId: string;
  gasNeeded: string;
  cost: string;
  fee: string;
  costUsd: number;
  feeUsd: number;
  deliveryAmount: number;
  paymentToken: QuotePaymentToken;
  deliveryAsset: GasDeliveryAsset;
  liquidity: { ok: boolean; reason?: string };
  expiresAt: string;
};

const QUOTE_TTL_SEC = 120;

function paymentTokenUsd(
  token: QuotePaymentToken,
  tick: Awaited<ReturnType<typeof getOracleTick>>,
): number {
  if (token === "USDC" || token === "DAI") return 1;
  if (token === "MON") return tick.MON_Price;
  if (token === "BASE") return tick.BASE_Price;
  return tick.ETH_Price;
}

/** Layer 2 — Quoter: payment token → delivery gas + fees */
export async function buildGasQuote(req: GasQuoterRequest): Promise<GasQuoterResponse> {
  const gasWei = BigInt(req.gasEstimateWei);
  if (gasWei <= 0n) throw new Error("gasEstimateWei must be positive");

  const tick = await getOracleTick();
  const deliveryAmount = Number(formatEther(gasWei));
  const deliveryPriceUsd = getAssetUsdPrice(req.deliveryAsset, tick, true);
  const gasCostUsd = deliveryAmount * deliveryPriceUsd;

  const accounting = computePackageAccounting(Math.max(gasCostUsd, 0.01));
  const feeUsd = accounting.protocolFeeUsd + accounting.networkFeeUsd;
  const costUsd = gasCostUsd + feeUsd;

  const payPriceUsd = paymentTokenUsd(req.paymentToken, tick);
  const costInToken = costUsd / payPriceUsd;
  const feeInToken = feeUsd / payPriceUsd;

  const liquidity = await assessDeliveryLiquidity({
    deliveryAsset: req.deliveryAsset,
    deliveryAmount,
    depositChainId: req.depositChainId,
  });

  const gasLabel =
    req.deliveryAsset === "USDC"
      ? `${deliveryAmount.toFixed(2)} USDC`
      : `${deliveryAmount.toFixed(6)} ${req.deliveryAsset}`;

  let costLabel: string;
  let feeLabel: string;
  if (req.paymentToken === "USDC" || req.paymentToken === "DAI") {
    costLabel = `${costInToken.toFixed(2)} ${req.paymentToken}`;
    feeLabel = `${feeInToken.toFixed(2)} ${req.paymentToken}`;
  } else {
    costLabel = `${costInToken.toFixed(6)} ${req.paymentToken}`;
    feeLabel = `${feeInToken.toFixed(6)} ${req.paymentToken}`;
  }

  return {
    quoteId: randomUUID(),
    gasNeeded: gasLabel,
    cost: costLabel,
    fee: feeLabel,
    costUsd,
    feeUsd,
    deliveryAmount,
    paymentToken: req.paymentToken,
    deliveryAsset: req.deliveryAsset,
    liquidity: { ok: liquidity.ok, reason: liquidity.reason },
    expiresAt: new Date(Date.now() + QUOTE_TTL_SEC * 1000).toISOString(),
  };
}
