export type { ManuelGasTarget, ManuelGasQuote } from "@/lib/oracle/calculate-manuel-gas-out";
export { calculateManuelGasOut } from "@/lib/oracle/calculate-manuel-gas-out";
export { getLivePrices, PROTOCOL_PROFIT_RATE } from "@/lib/oracle/live-prices";

import { calculateManuelGasOut } from "@/lib/oracle/calculate-manuel-gas-out";

/** @deprecated calculateManuelGasOut(..., "ETH") kullanın */
export async function estimateManuelGasWei(amountPaidUsdc: string): Promise<bigint> {
  const paid = Number(amountPaidUsdc);
  const quote = await calculateManuelGasOut(paid, "ETH");
  return quote.contractGasWei;
}
