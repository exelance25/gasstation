import { parseEther } from "viem";
import type { AmountOption } from "@/lib/pricing";

/**
 * Paket başına minimum ETH gereksinimi (simüle — üretimde oracle + gas ile hesaplanır).
 */
export const PACKAGE_MIN_ETH: Record<AmountOption, string> = {
  5: "0.002",
  10: "0.004",
  20: "0.008",
};

export function getRequiredWeiForPackage(amount: AmountOption): bigint {
  return parseEther(PACKAGE_MIN_ETH[amount]);
}
