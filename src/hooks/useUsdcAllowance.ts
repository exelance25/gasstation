"use client";

import { useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { erc20Abi } from "@config/web3";
import { getTreasuryAddress } from "@/lib/treasury-config";
import type { AmountOption } from "@/lib/pricing";

const REFETCH_MS = 8_000;

type UseUsdcAllowanceArgs = {
  selectedAmount: AmountOption;
  depositChainId: number | null;
  usdcAddress: `0x${string}` | null;
  address: `0x${string}` | undefined;
  isConnected: boolean;
};

export function useUsdcAllowance({
  selectedAmount,
  depositChainId,
  usdcAddress,
  address,
  isConnected,
}: UseUsdcAllowanceArgs) {
  const treasury = getTreasuryAddress();
  const requiredWei = parseUnits(String(selectedAmount), 6);

  const { data: allowance, isLoading, refetch } = useReadContract({
    address: usdcAddress ?? undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && treasury ? [address, treasury] : undefined,
    chainId: depositChainId ?? undefined,
    query: {
      enabled: Boolean(isConnected && address && usdcAddress && treasury && depositChainId),
      refetchInterval: REFETCH_MS,
    },
  });

  const allowanceWei = allowance ?? 0n;
  const needsApprove =
    isConnected &&
    Boolean(treasury) &&
    Boolean(usdcAddress) &&
    Boolean(depositChainId) &&
    allowanceWei < requiredWei;

  return {
    allowanceWei,
    requiredWei,
    needsApprove,
    isLoading,
    refetch,
    treasury,
    usdc: usdcAddress,
    depositChainId,
  };
}
