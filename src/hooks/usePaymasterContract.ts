"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import {
  formatNativeBalance,
  isPaymasterDeployed,
  readFeeTokenAllowance,
  readPaymasterOwner,
  readPoolNativeBalance,
} from "@/lib/paymaster";
import { getDefaultFeeToken } from "@/config/pool-tokens";

export function usePaymasterContract(userAddress?: Address) {
  const deployed = isPaymasterDeployed();
  const feeToken = getDefaultFeeToken();

  const poolQuery = useQuery({
    queryKey: ["paymaster-pool-native"],
    queryFn: readPoolNativeBalance,
    enabled: deployed,
    staleTime: 20_000,
  });

  const allowanceQuery = useQuery({
    queryKey: ["paymaster-allowance", userAddress, feeToken],
    queryFn: () => readFeeTokenAllowance(userAddress!, feeToken),
    enabled: deployed && Boolean(userAddress) && feeToken !== "0x0000000000000000000000000000000000000000",
    staleTime: 15_000,
  });

  const ownerQuery = useQuery({
    queryKey: ["paymaster-owner"],
    queryFn: readPaymasterOwner,
    enabled: deployed,
    staleTime: 60_000,
  });

  const isOwner =
    Boolean(userAddress && ownerQuery.data) &&
    userAddress?.toLowerCase() === ownerQuery.data?.toLowerCase();

  return {
    isDeployed: deployed,
    poolNativeFormatted: formatNativeBalance(poolQuery.data ?? 0n),
    poolNativeWei: poolQuery.data ?? 0n,
    allowanceWei: allowanceQuery.data ?? 0n,
    feeToken,
    isOwner,
    ownerAddress: ownerQuery.data,
    refetch: () => {
      void poolQuery.refetch();
      void allowanceQuery.refetch();
    },
  };
}
