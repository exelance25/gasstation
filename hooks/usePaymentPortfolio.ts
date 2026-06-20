"use client";

import { useMemo } from "react";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { clientEnv } from "@/config/client-env";
import type { PaySymbol } from "@/config/payment-assets";
import { getLivePrices } from "@/lib/oracle/live-prices";
import { filterSpendableWalletAssets, filterWalletDisplayAssets } from "@/lib/payment-portfolio-filter";
import { useWalletContext } from "@/providers/WalletContext";
import {
  DEPOSIT_EVM_CHAIN_IDS,
  USDC_DECIMALS,
  erc20Abi,
  getChainDisplayName,
  getUsdcAddress,
} from "../config/web3";
import {
  getSolanaCluster,
  getSolanaDepositChainId,
  getSolanaUsdcMint,
  isSolanaDepositConfigured,
} from "@/config/solana-usdc";
import { isSolanaGasEnabled } from "@/config/gas-features";
import { fetchSolanaUsdcBalance } from "@/lib/solana-spl-usdc";

const REFETCH_MS = 12_000;

export type DepositWalletKind = "evm" | "solana" | "hybrid" | null;

export type PaymentAssetRow = {
  key: string;
  kind: "evm" | "solana";
  chainId: number;
  chainName: string;
  paySymbol: PaySymbol;
  paymentMode: "usdc" | "native";
  amount: number;
  amountRaw: bigint;
  usdcAddress?: `0x${string}`;
  usdcMint?: string;
};

function isMainnet(): boolean {
  return clientEnv.NEXT_PUBLIC_APP_ENV === "mainnet";
}

function primaryEvmChainIds(): { base: number; mon: number } {
  return isMainnet()
    ? { base: 8453, mon: 143 }
    : { base: 84532, mon: 10143 };
}

export function usePaymentPortfolio() {
  const {
    evmAddress: ctxEvmAddress,
    evmConnected: ctxEvmConnected,
    solanaAddress: ctxSolanaAddress,
    solanaConnected: ctxSolanaConnected,
  } = useWalletContext();

  const { address: wagmiAddress } = useAccount();
  const solana = useWallet();

  const evmAddress = ctxEvmAddress;
  const evmConnected = ctxEvmConnected;
  const solanaAddress = ctxSolanaConnected ? ctxSolanaAddress : undefined;
  const solanaConnected = ctxSolanaConnected;

  const walletKind: DepositWalletKind =
    evmConnected && solanaConnected
      ? "hybrid"
      : evmConnected
        ? "evm"
        : solanaConnected
          ? "solana"
          : null;

  const anyConnected = isSolanaGasEnabled()
    ? walletKind !== null
    : evmConnected;
  const chains = primaryEvmChainIds();
  const ethChainId = isMainnet() ? 1 : 11155111;

  const { data: livePrices, isLoading: pricesLoading } = useQuery({
    queryKey: ["wallet-live-prices"],
    queryFn: getLivePrices,
    enabled: anyConnected,
    refetchInterval: REFETCH_MS,
  });

  const ethBal = useBalance({
    address: evmAddress,
    chainId: ethChainId,
    query: { enabled: evmConnected && Boolean(evmAddress), refetchInterval: REFETCH_MS },
  });

  const baseBal = useBalance({
    address: evmAddress,
    chainId: chains.base,
    query: { enabled: evmConnected && Boolean(evmAddress), refetchInterval: REFETCH_MS },
  });
  const monBal = useBalance({
    address: evmAddress,
    chainId: chains.mon,
    query: { enabled: evmConnected && Boolean(evmAddress), refetchInterval: REFETCH_MS },
  });

  const scanContracts = useMemo(() => {
    if (!evmConnected || !evmAddress) return [];
    return DEPOSIT_EVM_CHAIN_IDS.flatMap((id) => {
      const usdc = getUsdcAddress(id);
      if (!usdc) return [];
      return [
        {
          address: usdc,
          abi: erc20Abi,
          functionName: "balanceOf" as const,
          args: [evmAddress] as const,
          chainId: id,
        },
      ];
    });
  }, [evmAddress, evmConnected]);

  const {
    data: scanResults,
    isLoading: evmScanLoading,
    refetch: refetchEvm,
  } = useReadContracts({
    contracts: scanContracts,
    query: {
      enabled: evmConnected && scanContracts.length > 0,
      refetchInterval: REFETCH_MS,
    },
  });

  const {
    data: solanaUsdc = 0,
    isLoading: solanaScanLoading,
    refetch: refetchSolana,
  } = useQuery({
    queryKey: ["solana-usdc-balance", solanaAddress, getSolanaUsdcMint()],
    queryFn: () => fetchSolanaUsdcBalance(solanaAddress!),
    enabled: solanaConnected && isSolanaDepositConfigured(),
    refetchInterval: REFETCH_MS,
  });

  const { data: solNative = 0, isLoading: solNativeLoading } = useQuery({
    queryKey: ["solana-native", solanaAddress],
    enabled: solanaConnected && Boolean(solanaAddress),
    refetchInterval: REFETCH_MS,
    queryFn: async () => {
      const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
      const rpc =
        process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC ?? "https://api.devnet.solana.com";
      const c = new Connection(rpc, "confirmed");
      const lamports = await c.getBalance(new PublicKey(solanaAddress!));
      return lamports / LAMPORTS_PER_SOL;
    },
  });

  const evmRows = useMemo((): PaymentAssetRow[] => {
    if (!evmConnected || !evmAddress) return [];
    const rows: PaymentAssetRow[] = [];

    const ethAmount = Number(formatUnits(ethBal.data?.value ?? 0n, 18));
    rows.push({
      key: `native-eth-${ethChainId}`,
      kind: "evm",
      chainId: ethChainId,
      chainName: getChainDisplayName(ethChainId),
      paySymbol: "ETH",
      paymentMode: "native",
      amount: ethAmount,
      amountRaw: ethBal.data?.value ?? 0n,
    });

    rows.push({
      key: `native-base-${chains.base}`,
      kind: "evm",
      chainId: chains.base,
      chainName: getChainDisplayName(chains.base),
      paySymbol: "BASE",
      paymentMode: "native",
      amount: Number(formatUnits(baseBal.data?.value ?? 0n, 18)),
      amountRaw: baseBal.data?.value ?? 0n,
    });

    rows.push({
      key: `native-mon-${chains.mon}`,
      kind: "evm",
      chainId: chains.mon,
      chainName: getChainDisplayName(chains.mon),
      paySymbol: "MON",
      paymentMode: "native",
      amount: Number(formatUnits(monBal.data?.value ?? 0n, 18)),
      amountRaw: monBal.data?.value ?? 0n,
    });

    scanResults?.forEach((result, i) => {
      const contract = scanContracts[i];
      if (!contract || result.status !== "success") return;
      const wei = result.result as bigint;
      const amount = Number(formatUnits(wei, USDC_DECIMALS));
      if (amount <= 0) return;
      rows.push({
        key: `usdc-${contract.chainId}`,
        kind: "evm",
        chainId: contract.chainId,
        chainName: getChainDisplayName(contract.chainId),
        paySymbol: "USDC",
        paymentMode: "usdc",
        amount,
        amountRaw: wei,
        usdcAddress: contract.address,
      });
    });

    return rows;
  }, [
    evmConnected,
    evmAddress,
    ethBal.data?.value,
    ethChainId,
    baseBal.data?.value,
    monBal.data?.value,
    scanResults,
    scanContracts,
    chains,
  ]);

  const solanaRows = useMemo((): PaymentAssetRow[] => {
    if (!solanaConnected || !isSolanaGasEnabled()) return [];
    const cluster = getSolanaCluster();
    const label = cluster === "mainnet-beta" ? "Solana" : "Solana Devnet";
    const rows: PaymentAssetRow[] = [];

    if (solNative > 0) {
      rows.push({
        key: `native-sol-${cluster}`,
        kind: "solana",
        chainId: getSolanaDepositChainId(),
        chainName: label,
        paySymbol: "SOL",
        paymentMode: "native",
        amount: solNative,
        amountRaw: BigInt(Math.floor(solNative * 1_000_000_000)),
      });
    }

    if (solanaUsdc > 0) {
      rows.push({
        key: `usdc-sol-${cluster}`,
        kind: "solana",
        chainId: getSolanaDepositChainId(),
        chainName: label,
        paySymbol: "USDC",
        paymentMode: "usdc",
        amount: solanaUsdc,
        amountRaw: BigInt(Math.floor(solanaUsdc * 1_000_000)),
        usdcMint: getSolanaUsdcMint(),
      });
    }

    return rows;
  }, [solanaConnected, solNative, solanaUsdc]);

  const allPaymentAssets = useMemo(
    () => [...evmRows, ...solanaRows],
    [evmRows, solanaRows],
  );

  const spendableAssets = useMemo(
    () => filterSpendableWalletAssets(allPaymentAssets, livePrices),
    [allPaymentAssets, livePrices],
  );

  const displayAssets = useMemo(
    () => filterWalletDisplayAssets(allPaymentAssets),
    [allPaymentAssets],
  );

  const portfolioSummary = useMemo(() => {
    const sum: Partial<Record<PaySymbol, number>> = {};
    for (const row of spendableAssets) {
      if (row.paySymbol === "USDC") {
        sum.USDC = (sum.USDC ?? 0) + row.amount;
      } else {
        sum[row.paySymbol] = Math.max(sum[row.paySymbol] ?? 0, row.amount);
      }
    }
    return sum;
  }, [spendableAssets]);

  const isLoading =
    pricesLoading ||
    (evmConnected && (evmScanLoading || ethBal.isLoading || baseBal.isLoading || monBal.isLoading)) ||
    (solanaConnected && (solanaScanLoading || solNativeLoading));

  const usdcRows = spendableAssets.filter((r) => r.paymentMode === "usdc");
  const maxSpendableUsdc = usdcRows.reduce((m, r) => Math.max(m, r.amount), 0);

  return {
    walletKind,
    anyConnected,
    evmConnected,
    solanaConnected,
    allPaymentAssets,
    displayAssets,
    spendableAssets,
    portfolioSummary,
    isLoading,
    allDepositNetworks: usdcRows,
    maxSpendableUsdc,
    refetch: () => {
      void refetchEvm();
      void refetchSolana();
    },
  };
}

export type DepositNetworkRow = PaymentAssetRow;

export function useDepositUsdcBalance() {
  return usePaymentPortfolio();
}
