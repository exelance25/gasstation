import { parseEther } from "viem";
import type { AmountOption } from "@/lib/pricing";
import { getRequiredWeiForPackage } from "@/lib/package-requirements";

/** Base üzerinde tx gas için minimum native ETH */
export const MIN_BASE_GAS_WEI = parseEther("0.00005");

export function getPaymentWeiForPackage(amount: AmountOption): bigint {
  return getRequiredWeiForPackage(amount);
}

export function hasEnoughForPayment(balanceWei: bigint, amount: AmountOption): boolean {
  return balanceWei >= getPaymentWeiForPackage(amount);
}

export function hasEnoughForGas(balanceWei: bigint): boolean {
  return balanceWei >= MIN_BASE_GAS_WEI;
}

export function hasEnoughForManualPump(balanceWei: bigint, amount: AmountOption): boolean {
  return balanceWei >= getPaymentWeiForPackage(amount) + MIN_BASE_GAS_WEI;
}
