import { calculatePackageQuote, type AmountOption } from "@/lib/pricing";
import { parseEther } from "viem";
import { getLivePrices, PROTOCOL_PROFIT_RATE } from "@/lib/oracle/live-prices";

export type ManuelGasTarget = "ETH" | "MON";

export type ManuelGasQuote = Awaited<ReturnType<typeof calculateManuelGasOut>>;

/** @deprecated use calculatePackageQuote */
export async function calculateManuelGasOut(
  usdcAmountIn: number,
  targetToken: ManuelGasTarget = "ETH",
) {
  const prices = await getLivePrices();
  const netUsdcForGas = usdcAmountIn * (1 - PROTOCOL_PROFIT_RATE);

  let pureGasAmount = 0;
  if (targetToken === "ETH") {
    pureGasAmount = netUsdcForGas / prices.ETH_Price;
  } else {
    pureGasAmount = netUsdcForGas / prices.MON_Price;
  }

  const ethForPool =
    targetToken === "ETH"
      ? pureGasAmount
      : (pureGasAmount * prices.MON_Price) / prices.ETH_Price;

  return {
    usdcIn: usdcAmountIn,
    netUsdcForGas,
    targetToken,
    pureGasAmount,
    contractGasWei: parseEther(ethForPool.toFixed(18)),
    prices,
  };
}

/** Admin panel serbest tutar girişi */
export async function calculateManuelGasOutFromUsd(
  usdAmount: number,
  targetToken: ManuelGasTarget = "ETH",
) {
  return calculateManuelGasOut(usdAmount, targetToken);
}

export { calculatePackageQuote, type AmountOption };
