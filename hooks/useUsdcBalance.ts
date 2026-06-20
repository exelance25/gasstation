"use client";

import { useMemo } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import {
  DEPOSIT_EVM_CHAIN_IDS,
  USDC_DECIMALS,
  erc20Abi,
  getChainDisplayName,
  getUsdcAddress,
  isUsdcDepositChain,
} from "../config/web3";

const REFETCH_MS = 12_000;

export type ChainUsdcBalance = {
  chainId: number;
  chainName: string;
  amount: number;
  amountWei: bigint;
  usdcAddress: `0x${string}`;
};

export type UsdcBalanceState = {
  formatted: string;
  /** Örn: "15.50 USDC (Base)" */
  displayLabel: string;
  amount: number;
  amountWei: bigint;
  isConnected: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  chainId: number | null;
  depositChainId: number | null;
  chainName: string;
  usdcAddress: `0x${string}` | null;
  isDepositChainSupported: boolean;
  /** Tüm desteklenen ağlardaki USDC taraması (sadece bakiyesi okunanlar) */
  balancesByChain: ChainUsdcBalance[];
  /** Tüm depozit ağları — 0 bakiyeli ağlar dahil */
  allDepositChains: ChainUsdcBalance[];
  /** Tek işlemde kullanılabilir en yüksek ağ bakiyesi (USDC) */
  maxSpendableUsdc: number;
  refetch: () => void;
};

/**
 * Evrensel USDC — aktif ağ + Ethereum / Base / Monad otomatik tarama.
 */
export function useUsdcBalance(): UsdcBalanceState {
  const { address, isConnected, chainId } = useAccount();

  const scanContracts = useMemo(() => {
    if (!address) return [];
    return DEPOSIT_EVM_CHAIN_IDS.flatMap((id) => {
      const usdc = getUsdcAddress(id);
      if (!usdc) return [];
      return [
        {
          address: usdc,
          abi: erc20Abi,
          functionName: "balanceOf" as const,
          args: [address] as const,
          chainId: id,
        },
      ];
    });
  }, [address]);

  const { data: scanResults, isLoading: scanLoading, refetch } = useReadContracts({
    contracts: scanContracts,
    query: {
      enabled: Boolean(isConnected && address && scanContracts.length > 0),
      refetchInterval: REFETCH_MS,
    },
  });

  const balancesByChain = useMemo((): ChainUsdcBalance[] => {
    if (!scanResults?.length) return [];
    const rows: ChainUsdcBalance[] = [];
    scanResults.forEach((result, i) => {
      const contract = scanContracts[i];
      if (!contract || result.status !== "success") return;
      const wei = result.result as bigint;
      rows.push({
        chainId: contract.chainId,
        chainName: getChainDisplayName(contract.chainId),
        amount: Number(formatUnits(wei, USDC_DECIMALS)),
        amountWei: wei,
        usdcAddress: contract.address,
      });
    });
    return rows.sort((a, b) => b.amount - a.amount);
  }, [scanResults, scanContracts]);

  /** Tüm depozit ağları — bakiye 0 olanlar dahil (kullanıcı seçimi için) */
  const allDepositChains = useMemo((): ChainUsdcBalance[] => {
    const byId = new Map(balancesByChain.map((b) => [b.chainId, b]));
    return DEPOSIT_EVM_CHAIN_IDS.flatMap((chainId) => {
      const usdc = getUsdcAddress(chainId);
      if (!usdc) return [];
      const hit = byId.get(chainId);
      if (hit) return [hit];
      return [
        {
          chainId,
          chainName: getChainDisplayName(chainId),
          amount: 0,
          amountWei: 0n,
          usdcAddress: usdc,
        },
      ];
    }).sort((a, b) => b.amount - a.amount);
  }, [balancesByChain]);

  const activeDepositChainId = isUsdcDepositChain(chainId) ? chainId : null;

  const depositChainId = activeDepositChainId;
  const usdcAddress = depositChainId ? getUsdcAddress(depositChainId) : null;
  const isDepositChainSupported = depositChainId !== null && usdcAddress !== null;

  const displayRow = useMemo(() => {
    if (activeDepositChainId) {
      return balancesByChain.find((b) => b.chainId === activeDepositChainId) ?? null;
    }
    return balancesByChain.find((b) => b.amount > 0) ?? balancesByChain[0] ?? null;
  }, [activeDepositChainId, balancesByChain]);

  const amountWei = displayRow?.amountWei ?? 0n;
  const amount = displayRow?.amount ?? 0;
  const chainName = displayRow?.chainName ?? getChainDisplayName(chainId);

  const displayLabel = useMemo(() => {
    if (!isConnected) return "— USDC";
    if (scanLoading && balancesByChain.length === 0) return "… USDC";
    if (!displayRow) return "0.00 USDC";
    return `${displayRow.amount.toFixed(2)} USDC (${displayRow.chainName})`;
  }, [isConnected, scanLoading, balancesByChain.length, displayRow]);

  const formatted = useMemo(() => {
    if (!isConnected) return "0.00";
    if (scanLoading && balancesByChain.length === 0) return "…";
    return displayRow ? displayRow.amount.toFixed(2) : "0.00";
  }, [isConnected, scanLoading, balancesByChain.length, displayRow]);

  const maxSpendableUsdc = useMemo(
    () => balancesByChain.reduce((max, row) => Math.max(max, row.amount), 0),
    [balancesByChain],
  );

  return {
    formatted,
    displayLabel,
    amount,
    amountWei,
    isConnected,
    isLoading: isConnected && scanLoading,
    isConfigured: isDepositChainSupported,
    chainId: depositChainId,
    depositChainId,
    chainName,
    usdcAddress,
    isDepositChainSupported,
    balancesByChain,
    allDepositChains,
    maxSpendableUsdc,
    refetch: () => void refetch(),
  };
}
