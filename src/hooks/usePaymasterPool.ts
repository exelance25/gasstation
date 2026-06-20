"use client";

import type { Address } from "viem";
import { usePaymasterContract } from "@/hooks/usePaymasterContract";

/** @deprecated usePaymasterContract kullanın */
export function usePaymasterPool(userAddress?: Address) {
  const data = usePaymasterContract(userAddress);
  return {
    isDeployed: data.isDeployed,
    balanceWei: data.allowanceWei,
    balanceFormatted: String(data.allowanceWei),
    isLoading: false,
    refetch: data.refetch,
  };
}
