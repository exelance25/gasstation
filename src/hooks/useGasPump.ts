"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useBalance, usePublicClient, useSendTransaction, useSwitchChain, useWalletClient, useWriteContract } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import { parseUnits, type Hash } from "viem";
import {
  computePackageUsdFromDeliveryAmount,
  formatPackageUsd,
  isPackageAffordable,
  isValidDeliveryAmount,
  roundPackageUsd,
  type AmountOption,
} from "@/lib/pricing";
import type { DepotAssetId, GasDeliveryAsset } from "@/config/depot-assets";
import { isActiveGasDeliveryAsset } from "@/config/depot-assets";
import { postDispenseGas } from "@/lib/api/dispense-gas";
import { postDepositIntent, postRetryDispense } from "@/lib/api/deposit-intent";
import { useWalletContext } from "@/providers/WalletContext";
import { usePumpPassSilent } from "@/hooks/usePumpPass";
import { postDispensePrecheck } from "@/lib/api/dispense-precheck";
import { defaultDeliveryAssetForDepositChain } from "@/lib/deposit-delivery-map";
import { getDeliveryNetworkLabel } from "@/lib/explorer-urls";
import {
  detectTargetKind,
  isTargetFormatMismatch,
  isValidDeliveryTarget,
} from "@/lib/delivery-target";
import { erc20Abi } from "@/lib/erc20-abi";
import { useCollectorAddress } from "@/hooks/useCollectorAddress";
import { getSolanaRpcUrl } from "@/config/solana-usdc";
import { buildSolanaUsdcTransferTransaction } from "@/lib/solana-spl-usdc";
import { useToast } from "@/providers/ToastProvider";
import { useTransactionLock } from "@/hooks/useTransactionLock";
import { useGasMode } from "@/hooks/useGasMode";
import { useDepositUsdcBalance } from "../../hooks/useDepositUsdcBalance";
import { useOracleQuote } from "@/hooks/useOracleQuote";
import { isAutoFeeEnabled } from "@/config/client-env";
import {
  computeNativePaymentWei,
  isManualPaySymbol,
} from "@/lib/manual-payment";
import { rowUsdValue } from "@/lib/payment-portfolio-filter";
import type { LivePrices } from "@/lib/oracle/live-prices";
import { formatGasUserError } from "@/lib/gas-user-errors";
import { messages } from "@/i18n/messages";
import { STUB_ORACLE_PRICES } from "@/lib/oracle/stub-prices";
import { isDeliveryAssetEnabled, isSolanaGasEnabled } from "@/config/gas-features";
import type { FeeQuote } from "@gasstation/fee-sdk";
import {
  executeAutomaticFee,
  fetchAutomaticFeeQuote,
  formatNativePaymentDisplay,
} from "@/lib/auto-fee/execute-automatic-fee";
import { isNativeTreasuryConfigured } from "@/lib/auto-fee/treasury-native";
import {
  resolveAutoFeePath,
  type AutoFeePath,
} from "@/lib/auto-fee/path-resolver";
import { executePaymasterUsdc } from "@/lib/auto-fee/execute-paymaster-usdc";
import { executeErc4337GasPurchase } from "@/lib/auto-fee/execute-erc4337-gas-purchase";
import { useRelayerStatus } from "@/hooks/useRelayerStatus";
import { getPaymasterChainId } from "@/lib/paymaster-config";
import { waitForDepositReceipt } from "@/lib/evm-chain-client";
import { estimatePumpFuelSeconds } from "@/lib/pump-fuel-estimate";
import {
  sendErc20TransferViaProvider,
  sendNativeDepositViaProvider,
} from "@/lib/evm-send-deposit";

export type PumpButtonBlockReason =
  | null
  | "wallet"
  | "deposit_network"
  | "invalid_target"
  | "insufficient_usdc"
  | "below_minimum"
  | "collector"
  | "treasury_native"
  | "insufficient_native"
  | "insufficient_usdc_paymaster"
  | "paymaster_chain"
  | "auto_quote"
  | "automatic_soon"
  | "invalid_amount"
  | "pumping"
  | "tank_empty"
  | "precheck_loading";

export type PumpActionMode = "fire" | "blocked";

export type PumpFlowStatus = {
  phase: "idle" | "fueling" | "success" | "error";
  title: string;
  detail?: string;
  deliveryTxHash?: string;
  deliveryAsset?: DepotAssetId;
  fuelEstimateSec?: number;
  fuelStartedAt?: number;
  fuelHint?: string;
};

export function useGasPump() {
  const { address: evmAddress, chainId: walletChainId, connector } = useAccount();
  const { evmAddress: ctxEvmAddress, evmConnected: ctxEvmConnected } = useWalletContext();
  const paymentEvmAddress = (ctxEvmAddress ?? evmAddress) as `0x${string}` | undefined;
  const pumpPassSilent = usePumpPassSilent(paymentEvmAddress, ctxEvmConnected);
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { data: walletClient } = useWalletClient();
  const solanaWallet = useWallet();
  const { publicKey: solanaPublicKey, sendTransaction: solanaSendTransaction } = solanaWallet;
  const { showToast, dismissToast, dismissByVariant } = useToast();
  const { isLocked, runLocked } = useTransactionLock();
  const { mode } = useGasMode();
  const {
    refetch: refetchUsdc,
    allPaymentAssets,
    displayAssets,
    spendableAssets,
    allDepositNetworks,
    isLoading: usdcScanLoading,
    anyConnected,
    walletKind,
    evmConnected,
    solanaConnected,
  } = useDepositUsdcBalance();

  const [selectedDepositKey, setSelectedDepositKey] = useState<string | null>(null);
  const [desiredAmountInput, setDesiredAmountInput] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<GasDeliveryAsset>("ETH");
  const [targetAddress, setTargetAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoFeeQuote, setAutoFeeQuote] = useState<FeeQuote | null>(null);
  const [autoQuoteLoading, setAutoQuoteLoading] = useState(false);
  const [pumpBlockDetail, setPumpBlockDetail] = useState<string | null>(null);
  const [pumpFlow, setPumpFlow] = useState<PumpFlowStatus>({ phase: "idle", title: "" });
  const firingRef = useRef(false);
  const statusToastIdRef = useRef<string | null>(null);
  const successToastIdRef = useRef<string | null>(null);

  const autoFeeOn = mode === "automatic" && isAutoFeeEnabled();
  const { relayerEnabled } = useRelayerStatus();

  const parsedDeliveryAmount = useMemo(() => {
    const trimmed = desiredAmountInput.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }, [desiredAmountInput]);

  const isDeliveryAmountValid =
    parsedDeliveryAmount !== null &&
    isValidDeliveryAmount(parsedDeliveryAmount, selectedAsset);

  const { quote, loading: quoteLoading, refreshing: quoteRefreshing, oracleSource, marketPrices, lastUpdated } = useOracleQuote(
    isDeliveryAmountValid ? parsedDeliveryAmount : null,
    selectedAsset,
  );

  const priceSnapshot = useMemo((): LivePrices | undefined => {
    if (!quote) return undefined;
    return {
      ETH_Price: quote.ethPrice,
      BASE_Price: quote.basePrice,
      MON_Price: quote.monPrice,
      SOL_Price: quote.solPrice,
      USDC_Price: 1,
    };
  }, [quote]);

  const selectedAmount: AmountOption = useMemo(() => {
    if (!isDeliveryAmountValid || parsedDeliveryAmount === null) return 0;
    if (quote?.packageUsd && quote.packageUsd > 0) {
      return roundPackageUsd(quote.packageUsd);
    }
    const prices =
      priceSnapshot ??
      ({
        ETH_Price: quote?.ethPrice ?? STUB_ORACLE_PRICES.ETH_Price,
        BASE_Price: quote?.basePrice ?? STUB_ORACLE_PRICES.BASE_Price,
        MON_Price: quote?.monPrice ?? STUB_ORACLE_PRICES.MON_Price,
        SOL_Price: quote?.solPrice ?? STUB_ORACLE_PRICES.SOL_Price,
        USDC_Price: 1,
      } satisfies LivePrices);
    return computePackageUsdFromDeliveryAmount(parsedDeliveryAmount, selectedAsset, prices);
  }, [
    isDeliveryAmountValid,
    parsedDeliveryAmount,
    quote,
    priceSnapshot,
    selectedAsset,
  ]);

  const paymentRows = useMemo(() => {
    const pool = spendableAssets.length > 0 ? spendableAssets : allPaymentAssets;
    if (autoFeeOn) {
      return pool.filter((r) => r.paymentMode === "native");
    }
    return pool.filter((r) => isManualPaySymbol(r.paySymbol));
  }, [autoFeeOn, spendableAssets, allPaymentAssets]);

  const depositTarget = useMemo(
    () => spendableAssets.find((b) => b.key === selectedDepositKey)
      ?? allPaymentAssets.find((b) => b.key === selectedDepositKey)
      ?? null,
    [spendableAssets, allPaymentAssets, selectedDepositKey],
  );

  const evmNativeBalance = useBalance({
    address: evmAddress,
    chainId: depositTarget?.kind === "evm" ? depositTarget.chainId : undefined,
    query: {
      enabled: autoFeeOn && evmConnected && depositTarget?.kind === "evm",
    },
  });

  const [solanaNativeLamports, setSolanaNativeLamports] = useState<bigint | null>(null);

  useEffect(() => {
    if (!autoFeeOn || !depositTarget) {
      setAutoFeeQuote(null);
      return;
    }
    let cancelled = false;
    setAutoQuoteLoading(true);
    const payer =
      depositTarget.kind === "solana"
        ? solanaPublicKey?.toBase58()
        : evmAddress;
    void fetchAutomaticFeeQuote({
      deposit: depositTarget,
      deliveryAsset: selectedAsset,
      userAddress: payer,
    })
      .then((q) => {
        if (!cancelled) setAutoFeeQuote(q);
      })
      .catch(() => {
        if (!cancelled) setAutoFeeQuote(null);
      })
      .finally(() => {
        if (!cancelled) setAutoQuoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [autoFeeOn, depositTarget, selectedAsset, evmAddress, solanaPublicKey]);

  useEffect(() => {
    if (!autoFeeOn || !solanaConnected || !solanaPublicKey) {
      setSolanaNativeLamports(null);
      return;
    }
    let cancelled = false;
    const connection = new Connection(getSolanaRpcUrl(), "confirmed");
    void connection.getBalance(solanaPublicKey).then((lamports) => {
      if (!cancelled) setSolanaNativeLamports(BigInt(lamports));
    });
    return () => {
      cancelled = true;
    };
  }, [autoFeeOn, solanaConnected, solanaPublicKey]);

  const hasEnoughNativeForAuto = useMemo(() => {
    if (!autoFeeQuote) return false;
    const required = BigInt(autoFeeQuote.paymentAmount);
    if (depositTarget?.kind === "solana") {
      return solanaNativeLamports !== null && solanaNativeLamports >= required;
    }
    if (depositTarget?.kind === "evm") {
      return (evmNativeBalance.data?.value ?? 0n) >= required;
    }
    return false;
  }, [autoFeeQuote, depositTarget, solanaNativeLamports, evmNativeBalance.data?.value]);

  const selectedChainUsdc = depositTarget?.amount ?? 0;

  const selectedPaymentUsd = useMemo(() => {
    if (!depositTarget) return 0;
    if (depositTarget.paySymbol === "USDC") return depositTarget.amount;
    if (!priceSnapshot) return 0;
    return rowUsdValue(depositTarget, priceSnapshot);
  }, [depositTarget, priceSnapshot]);

  const { data: isSmartAccount } = useQuery({
    queryKey: ["smart-account", evmAddress, depositTarget?.chainId],
    queryFn: async () => {
      if (!evmAddress || !publicClient) return false;
      const code = await publicClient.getBytecode({ address: evmAddress });
      return Boolean(code && code !== "0x");
    },
    enabled: autoFeeOn && evmConnected && Boolean(evmAddress) && Boolean(publicClient),
    staleTime: 60_000,
  });

  const autoFeePath: AutoFeePath | null = useMemo(() => {
    if (!autoFeeOn) return null;
    return resolveAutoFeePath({
      deposit: depositTarget,
      selectedAsset,
      selectedAmountUsd: selectedAmount,
      hasEnoughNative: hasEnoughNativeForAuto,
      usdcBalance: selectedChainUsdc,
      relayerEnabled,
      isSmartAccount: Boolean(isSmartAccount),
    });
  }, [
    autoFeeOn,
    depositTarget,
    selectedAsset,
    selectedAmount,
    hasEnoughNativeForAuto,
    selectedChainUsdc,
    relayerEnabled,
    isSmartAccount,
  ]);

  const isBelowMinimumBalance = false;

  const amountInvalidHint = useMemo(() => {
    if (!desiredAmountInput.trim()) return "Almak istediğiniz miktarı girin";
    if (parsedDeliveryAmount === null) return "Geçerli bir sayı girin";
    if (!isDeliveryAmountValid) return "Miktar 0'dan büyük olmalı";
    return null;
  }, [desiredAmountInput, parsedDeliveryAmount, isDeliveryAmountValid]);

  const balanceWarning = useMemo(() => {
    if (!anyConnected) return null;
    if (!selectedDepositKey) return "Ödeme kaynağı seçin";
    if (
      isDeliveryAmountValid &&
      selectedAmount > 0 &&
      selectedPaymentUsd < selectedAmount
    ) {
      return `Bu işlem için ~${formatPackageUsd(selectedAmount)} gerekir`;
    }
    return null;
  }, [
    anyConnected,
    selectedDepositKey,
    isDeliveryAmountValid,
    selectedAmount,
    selectedPaymentUsd,
  ]);

  const depositChainName = depositTarget?.chainName ?? "—";
  const { address: collectorAddress, isConfigured: isCollectorReady, isLoading: collectorLoading } =
    useCollectorAddress();

  useEffect(() => {
    if (!anyConnected) {
      setSelectedDepositKey(null);
      return;
    }
    setSelectedDepositKey((prev) => {
      if (prev && paymentRows.some((c) => c.key === prev)) return prev;
      const withFunds = paymentRows.find((c) => c.amount > 0);
      return withFunds?.key ?? paymentRows[0]?.key ?? null;
    });
  }, [anyConnected, paymentRows]);

  const trimmedTarget = targetAddress.trim();
  const deferredTarget = useDeferredValue(trimmedTarget);
  const deferredPackageAmount = useDeferredValue(selectedAmount);
  const detectedTargetKind = useMemo(
    () => detectTargetKind(targetAddress),
    [targetAddress],
  );
  const isValidTarget = isValidDeliveryTarget(selectedAsset, targetAddress);
  const isTargetMismatch = isTargetFormatMismatch(selectedAsset, targetAddress);

  useEffect(() => {
    if (!isSolanaGasEnabled() && selectedAsset === "SOL") {
      setSelectedAsset("ETH");
    }
  }, [selectedAsset]);

  const hasEnoughOnSelectedChain = isPackageAffordable(selectedPaymentUsd, selectedAmount);
  const isFeeTokenReady = Boolean(depositTarget);

  const fuelSessionRef = useRef({ startedAt: 0, estimateSec: 12 });

  const setFuelingHint = useCallback((hint: string) => {
    setPumpFlow((prev) =>
      prev.phase === "fueling"
        ? { ...prev, fuelHint: hint }
        : {
            phase: "fueling",
            title: "Dolum",
            fuelHint: hint,
            fuelStartedAt: fuelSessionRef.current.startedAt,
            fuelEstimateSec: fuelSessionRef.current.estimateSec,
          },
    );
  }, []);

  const startFuelSession = useCallback(
    (hint = "Sipariş hazırlanıyor…") => {
      const estimateSec = estimatePumpFuelSeconds({
        depositChainId: depositTarget?.chainId,
        deliveryAsset: selectedAsset,
      });
      const startedAt = Date.now();
      fuelSessionRef.current = { startedAt, estimateSec };
      setPumpFlow({
        phase: "fueling",
        title: "Dolum",
        fuelHint: hint,
        fuelStartedAt: startedAt,
        fuelEstimateSec: estimateSec,
      });
    },
    [depositTarget?.chainId, selectedAsset],
  );

  const ensureEvmDepositChain = useCallback(async () => {
    if (!depositTarget || depositTarget.kind !== "evm") return;
    if (walletChainId === depositTarget.chainId) return;
    setFuelingHint(`${depositTarget.chainName} — MetaMask'ta ağı onaylayın.`);
    try {
      await switchChainAsync({ chainId: depositTarget.chainId });
    } catch (e) {
      throw new Error(
        `${depositTarget.chainName} ağına geçilemedi — MetaMask'ta bu ağı ekleyip onaylayın.`,
      );
    }
  }, [depositTarget, walletChainId, switchChainAsync, setFuelingHint]);

  useEffect(() => {
    if (!trimmedTarget || !detectedTargetKind || !isSolanaGasEnabled()) return;
    if (detectedTargetKind === "solana" && selectedAsset !== "SOL") {
      setSelectedAsset("SOL");
      return;
    }
    if (detectedTargetKind === "evm" && selectedAsset === "SOL") {
      setSelectedAsset("ETH");
    }
  }, [trimmedTarget, detectedTargetKind, selectedAsset, setSelectedAsset]);

  // Ödeme ağı değişince varsayılan gas teslim tokenı (Sepolia USDC → ETH, vb.)
  const lastDepositChainRef = useRef<number | null>(null);
  useEffect(() => {
    if (!depositTarget) return;
    if (lastDepositChainRef.current === depositTarget.chainId) return;
    lastDepositChainRef.current = depositTarget.chainId;
    setSelectedAsset(defaultDeliveryAssetForDepositChain(depositTarget.chainId));
  }, [depositTarget, setSelectedAsset]);

  const pumpButtonBlockReason: PumpButtonBlockReason = useMemo(() => {
    if (!anyConnected) return "wallet";
    if (!isDeliveryAmountValid || selectedAmount <= 0) return "invalid_amount";
    if (!selectedDepositKey || !depositTarget) return "deposit_network";
    if (mode === "automatic" && depositTarget.paymentMode !== "native") return "deposit_network";
    if (mode === "manual" && depositTarget && !isManualPaySymbol(depositTarget.paySymbol)) {
      return "deposit_network";
    }
    if (mode === "manual" && depositTarget?.kind === "solana") {
      return "deposit_network";
    }
    if (!trimmedTarget || !isValidTarget) return "invalid_target";
    if (!isDeliveryAssetEnabled(selectedAsset)) return "invalid_target";

    if (mode === "manual") {
      /* Operator tank precheck removed — no preemptive vault warnings for users */
    }

    if (mode === "automatic") {
      if (!isAutoFeeEnabled()) return "automatic_soon";
      if (!autoFeePath) {
        if (autoQuoteLoading) return "auto_quote";
        if (
          depositTarget?.kind === "evm" &&
          depositTarget.chainId !== getPaymasterChainId() &&
          !hasEnoughNativeForAuto
        ) {
          return "paymaster_chain";
        }
        if (
          depositTarget?.kind === "evm" &&
          depositTarget.chainId === getPaymasterChainId() &&
          selectedChainUsdc < selectedAmount
        ) {
          return "insufficient_usdc_paymaster";
        }
        return "insufficient_native";
      }
      if (autoFeePath === "native_settlement") {
        if (!isNativeTreasuryConfigured(depositTarget)) return "treasury_native";
        if (autoQuoteLoading || !autoFeeQuote) return "auto_quote";
      }
      return null;
    }

    if (isBelowMinimumBalance) return "below_minimum";
    if (!hasEnoughOnSelectedChain || !isFeeTokenReady) {
      return depositTarget?.paymentMode === "native" ? "insufficient_native" : "insufficient_usdc";
    }
    if (depositTarget.kind === "evm" && collectorLoading) return "precheck_loading";
    if (depositTarget.kind === "evm" && (!isCollectorReady || !collectorAddress)) {
      return "collector";
    }
    return null;
  }, [
    anyConnected,
    isDeliveryAmountValid,
    selectedDepositKey,
    depositTarget,
    mode,
    trimmedTarget,
    isValidTarget,
    autoQuoteLoading,
    autoFeeQuote,
    autoFeePath,
    hasEnoughNativeForAuto,
    selectedAmount,
    selectedChainUsdc,
    isBelowMinimumBalance,
    hasEnoughOnSelectedChain,
    isFeeTokenReady,
    collectorAddress,
    isCollectorReady,
    collectorLoading,
    selectedAsset,
    evmConnected,
  ]);

  const actionMode: PumpActionMode = pumpButtonBlockReason === null ? "fire" : "blocked";

  const isPreparing = useMemo(() => {
    if (
      pumpFlow.phase === "success" ||
      pumpFlow.phase === "error" ||
      pumpFlow.phase === "fueling"
    ) {
      return false;
    }
    if (!anyConnected || !isDeliveryAmountValid || !trimmedTarget || !isValidTarget) {
      return false;
    }
    if (quoteLoading || quoteRefreshing) return true;
    return false;
  }, [
    pumpFlow.phase,
    anyConnected,
    isDeliveryAmountValid,
    trimmedTarget,
    isValidTarget,
    quoteLoading,
    quoteRefreshing,
  ]);

  const prepareMessage = useMemo(() => {
    if (quoteLoading || quoteRefreshing) return "Fetching live prices…";
    return messages.pump.preparingOrder;
  }, [quoteLoading, quoteRefreshing]);

  const selectDeliveryAsset = useCallback((id: DepotAssetId) => {
    if (isActiveGasDeliveryAsset(id)) {
      setSelectedAsset(id);
    }
  }, []);

  const presentPumpSuccess = useCallback(
    (input: {
      title: string;
      message: string;
      panelDetail: string;
      deliveryTxHash?: string;
      deliveryAsset?: DepotAssetId;
    }) => {
      if (statusToastIdRef.current) {
        dismissToast(statusToastIdRef.current);
        statusToastIdRef.current = null;
      }
      dismissByVariant("status");
      if (successToastIdRef.current) {
        dismissToast(successToastIdRef.current);
        successToastIdRef.current = null;
      }
      setPumpFlow({
        phase: "success",
        title: input.title,
        detail: input.panelDetail,
        deliveryTxHash: input.deliveryTxHash,
        deliveryAsset: input.deliveryAsset,
        fuelStartedAt: fuelSessionRef.current.startedAt,
        fuelEstimateSec: fuelSessionRef.current.estimateSec,
      });
    },
    [dismissToast, dismissByVariant],
  );

  const clearPumpResult = useCallback(() => {
    setPumpFlow({ phase: "idle", title: "" });
    if (successToastIdRef.current) {
      dismissToast(successToastIdRef.current);
      successToastIdRef.current = null;
    }
  }, [dismissToast]);

  const canPump =
    pumpButtonBlockReason === null && !isLoading && !isLocked;

  const pumpGas = useCallback(async () => {
    setIsLoading(true);
    startFuelSession("Sipariş ve kasa kontrol ediliyor…");
    let completedDepositTx: string | undefined;
    let completedOrderId: string | undefined;
    let completedDepositor: string | undefined;
    let completedPackageUsd: number | undefined;
    let completedPaymentMode: "usdc" | "native" | undefined;
    try {
      if (!depositTarget) {
        throw new Error("Ödeme kaynağı seçilmedi.");
      }

      await runLocked(async () => {
        const packageUsd = roundPackageUsd(selectedAmount);
        if (packageUsd <= 0) {
          throw new Error("Geçersiz ödeme tutarı — gas miktarını kontrol edin.");
        }

        const precheck = await postDispensePrecheck({
          targetAsset: selectedAsset,
          packageAmount: packageUsd,
          targetAddress: trimmedTarget,
        });
        if (!precheck.ok) {
          throw new Error(messages.pump.deliveryUnavailable);
        }

        setFuelingHint("Ödeme adımına geçiliyor…");
        if (autoFeeOn) {
          const payer =
            depositTarget.kind === "solana"
              ? solanaPublicKey?.toBase58()
              : evmAddress;
          if (!payer) throw new Error("Cüzdan adresi bulunamadı");

          const onStatus = (title: string, message: string) => {
            if (statusToastIdRef.current) {
              dismissToast(statusToastIdRef.current);
            }
            statusToastIdRef.current = showToast({
              variant: "status",
              title: title || messages.pump.pendingTitle,
              message,
              persist: true,
            });
          };

          if (autoFeePath === "paymaster_usdc") {
            if (!evmAddress || !publicClient) throw new Error("EVM cüzdanı gerekli");
            const result = await executePaymasterUsdc({
              deliveryAsset: selectedAsset,
              beneficiaryAddress: trimmedTarget,
              packageUsd: selectedAmount,
              payerAddress: evmAddress,
              publicClient,
              writeContract: async (args) =>
                writeContractAsync({
                  address: args.address,
                  abi: args.abi,
                  functionName: args.functionName as "approve" | "buyGasManuel",
                  args: args.args as never,
                  chainId: args.chainId,
                }),
              chainId: depositTarget.chainId,
              switchChain: async (chainId) => {
                await switchChainAsync({ chainId });
              },
              walletChainId,
              onStatus,
            });
            void refetchUsdc();
            presentPumpSuccess({
              title: "Yakıt gönderildi",
              message: `$${result.usdcPaid} USDC · paymaster · tx ${result.deliveryTxHash.slice(0, 10)}…`,
              panelDetail: `$${result.usdcPaid} USDC paymaster ile teslim edildi.`,
              deliveryTxHash: result.deliveryTxHash,
              deliveryAsset: selectedAsset,
            });
            return;
          }

          if (autoFeePath === "erc4337_relay") {
            if (!walletClient || !evmAddress) throw new Error("Smart account cüzdanı gerekli");
            const result = await executeErc4337GasPurchase({
              smartAccountAddress: evmAddress,
              deliveryAsset: selectedAsset,
              beneficiaryAddress: trimmedTarget,
              packageUsd: selectedAmount,
              walletClient,
              intentId: `yakit_al_${Date.now()}`,
              onStatus,
            });
            void refetchUsdc();
            showToast({
              variant: "success",
              title: "Gasless yakıt gönderildi",
              message: `ERC-4337 relayer · tx ${result.transactionHash.slice(0, 10)}…`,
            });
            return;
          }

          if (!autoFeeQuote) throw new Error("Otomatik ücret teklifi hazır değil");

          const result = await executeAutomaticFee({
            deposit: depositTarget,
            deliveryAsset: selectedAsset,
            beneficiaryAddress: trimmedTarget,
            payerAddress: payer,
            quote: autoFeeQuote,
            evm:
              depositTarget.kind === "evm" && evmAddress && publicClient
                ? {
                    sendTransaction: async (args) =>
                      sendTransactionAsync({
                        to: args.to,
                        value: args.value,
                        chainId: args.chainId,
                      }),
                    publicClient,
                    switchChain: async (chainId) => {
                      await switchChainAsync({ chainId });
                    },
                    walletChainId,
                  }
                : undefined,
            solana:
              depositTarget.kind === "solana" && solanaPublicKey && solanaSendTransaction
                ? { publicKey: solanaPublicKey, sendTransaction: solanaSendTransaction }
                : undefined,
            onStatus: (title, message) => {
              if (statusToastIdRef.current) dismissToast(statusToastIdRef.current);
              statusToastIdRef.current = showToast({
                variant: "status",
                title: title || messages.pump.pendingTitle,
                message,
                persist: true,
              });
            },
          });

          void refetchUsdc();

          if (statusToastIdRef.current) {
            dismissToast(statusToastIdRef.current);
            statusToastIdRef.current = null;
          }
          presentPumpSuccess({
            title: "Yakıt gönderildi",
            message: `${formatNativePaymentDisplay(autoFeeQuote)} ödendi · teslimat ${result.deliveryTxHash?.slice(0, 10) ?? "—"}…`,
            panelDetail: `${formatNativePaymentDisplay(autoFeeQuote)} ödendi.`,
            deliveryTxHash: result.deliveryTxHash,
            deliveryAsset: selectedAsset,
          });
          return;
        }

        if (selectedAmount <= 0) {
          throw new Error("Geçersiz ödeme tutarı — gas miktarını kontrol edin.");
        }

        const depositor =
          depositTarget.kind === "solana"
            ? solanaPublicKey?.toBase58()
            : paymentEvmAddress;
        if (!depositor) throw new Error("Cüzdan adresi bulunamadı");

        if (depositTarget.kind === "evm" && (!ctxEvmConnected || !paymentEvmAddress)) {
          throw new Error(
            "EVM cüzdanı tam bağlı değil — sayfayı yenileyip MetaMask ile tekrar bağlanın.",
          );
        }

        if (depositTarget.kind === "evm") {
          await ensureEvmDepositChain();
        }

        const paySymbol = depositTarget.paySymbol;
        const paymentMode = depositTarget.paymentMode;
        const passId = pumpPassSilent.getPassId() ?? undefined;

        const { orderId } = await postDepositIntent({
          targetAsset: selectedAsset,
          targetAddress: trimmedTarget,
          packageAmount: packageUsd,
          depositChainId: depositTarget.chainId,
          depositorAddress: depositor,
          passId,
          paySymbol,
          paymentMode,
        });
        completedOrderId = orderId;
        completedDepositor = depositor;
        completedPackageUsd = packageUsd;
        completedPaymentMode = paymentMode;

        setFuelingHint("Sipariş kaydedildi — cüzdan ödemesi hazırlanıyor…");

        const amountPaidWei = parseUnits(String(packageUsd), 6);
        let depositTxHash: string;

        if (depositTarget.kind === "solana") {
          if (!solanaPublicKey || !solanaSendTransaction) {
            throw new Error("Solana cüzdanı bağlı değil");
          }
          if (depositTarget.amountRaw < amountPaidWei) {
            throw new Error(
              `Solana'da yetersiz USDC — en az $${selectedAmount} gerekli`,
            );
          }

          if (statusToastIdRef.current) {
            dismissToast(statusToastIdRef.current);
            statusToastIdRef.current = null;
          }
          statusToastIdRef.current = showToast({
            variant: "status",
            title: "İşlem bekleniyor",
            message: `Solana: $${selectedAmount} USDC — Phantom onayını verin.`,
            persist: true,
          });

          const tx = await buildSolanaUsdcTransferTransaction({
            sender: solanaPublicKey,
            amountMicroUsdc: amountPaidWei,
          });
          const connection = new Connection(getSolanaRpcUrl(), "confirmed");
          const sig = await solanaSendTransaction(tx, connection);
          await connection.confirmTransaction(sig, "confirmed");
          depositTxHash = sig;
        } else if (depositTarget.paymentMode === "native") {
          if (!paymentEvmAddress || !collectorAddress || !priceSnapshot) {
            throw new Error("EVM native depozit için cüzdan veya kasa eksik");
          }
          if (
            depositTarget.paySymbol !== "ETH" &&
            depositTarget.paySymbol !== "BASE" &&
            depositTarget.paySymbol !== "MON"
          ) {
            throw new Error("Bu ödeme tokenı manuel modda desteklenmiyor");
          }

          const nativeWei = computeNativePaymentWei(
            packageUsd,
            depositTarget.paySymbol,
            priceSnapshot,
          );
          if (depositTarget.amountRaw < nativeWei) {
            throw new Error(
              `${depositTarget.chainName} üzerinde yetersiz ${depositTarget.paySymbol}`,
            );
          }

          setFuelingHint("MetaMask'ta ödemeyi onaylayın — gas otomatik gönderilir.");

          const nativeTxHash = await sendNativeDepositViaProvider({
            connector,
            from: paymentEvmAddress,
            to: collectorAddress,
            valueWei: nativeWei,
            chainId: depositTarget.chainId,
          });

          setFuelingHint("Ödeme gönderildi — blok onayı bekleniyor…");

          const nativeReceipt = await waitForDepositReceipt(
            depositTarget.chainId,
            nativeTxHash,
          );
          if (nativeReceipt.status !== "success") {
            throw new Error("Native depozit blokzincirde başarısız oldu");
          }
          depositTxHash = nativeTxHash;
        } else {
          if (!paymentEvmAddress || !collectorAddress || !depositTarget.usdcAddress) {
            throw new Error("EVM depozit için cüzdan veya kasa eksik");
          }
          if (depositTarget.amountRaw < amountPaidWei) {
            throw new Error(
              `${depositTarget.chainName} üzerinde yetersiz USDC — en az $${selectedAmount} gerekli`,
            );
          }

          setFuelingHint("MetaMask'ta USDC ödemesini onaylayın.");

          const usdcTxHash = await sendErc20TransferViaProvider({
            connector,
            from: paymentEvmAddress,
            token: depositTarget.usdcAddress,
            to: collectorAddress,
            amount: amountPaidWei,
            chainId: depositTarget.chainId,
          });

          setFuelingHint("Ödeme gönderildi — blok onayı bekleniyor…");

          const usdcReceipt = await waitForDepositReceipt(depositTarget.chainId, usdcTxHash);
          if (usdcReceipt.status !== "success") {
            throw new Error("USDC transferi blokzincirde başarısız oldu");
          }
          depositTxHash = usdcTxHash;
        }

        completedDepositTx = depositTxHash;

        setFuelingHint("Kasadan gas gönderiliyor…");

        const dispense = await postDispenseGas({
          txHash: depositTxHash,
          targetAsset: selectedAsset,
          targetAddress: trimmedTarget,
          packageAmount: packageUsd,
          depositorAddress: depositor,
          orderId,
          intentId: orderId,
          paymentMode,
        });

        void refetchUsdc();

        const gasLabel =
          selectedAsset === "SOL"
            ? dispense.estimatedGasAmount.toFixed(4)
            : dispense.estimatedGasAmount.toFixed(6);

        if (statusToastIdRef.current) {
          dismissToast(statusToastIdRef.current);
          statusToastIdRef.current = null;
        }
        presentPumpSuccess({
          title: "Yakıt gönderildi",
          message: `~${gasLabel} ${selectedAsset} · ${getDeliveryNetworkLabel(selectedAsset)} → ${trimmedTarget.slice(0, 8)}…`,
          panelDetail: `~${gasLabel} ${selectedAsset} hedef adrese ulaştı.`,
          deliveryTxHash: dispense.deliveryTxHash,
          deliveryAsset: selectedAsset,
        });
      });
    } catch (e) {
      if (statusToastIdRef.current) {
        dismissToast(statusToastIdRef.current);
        statusToastIdRef.current = null;
      }
      const base = formatGasUserError(e);

      if (completedDepositTx) {
        try {
          const retry = (await postRetryDispense(completedDepositTx, {
            orderId: completedOrderId,
            targetAsset: selectedAsset,
            targetAddress: trimmedTarget,
            packageAmount: completedPackageUsd ?? roundPackageUsd(selectedAmount),
            depositorAddress: completedDepositor,
          })) as {
            ok?: boolean;
            deliveryTxHash?: string;
            targetAsset?: DepotAssetId;
            estimatedGasAmount?: number;
            idempotent?: boolean;
          };
          if (retry.ok && retry.deliveryTxHash && retry.targetAsset) {
            const gasLabel =
              retry.targetAsset === "SOL"
                ? (retry.estimatedGasAmount ?? 0).toFixed(4)
                : (retry.estimatedGasAmount ?? 0).toFixed(6);
            presentPumpSuccess({
              title: retry.idempotent ? "Yakıt zaten gönderilmişti" : "Kasa teslimatı tamamlandı",
              message: `~${gasLabel} ${retry.targetAsset} · ${getDeliveryNetworkLabel(retry.targetAsset)}`,
              panelDetail: `~${gasLabel} ${retry.targetAsset} teslim edildi.`,
              deliveryTxHash: retry.deliveryTxHash,
              deliveryAsset: retry.targetAsset,
            });
            return;
          }
        } catch {
          /* retry failed — show original error */
        }
      }

      const depositLabel =
        completedPaymentMode === "native"
          ? "Your native deposit"
          : "Your USDC deposit";
      const message = completedDepositTx
        ? `${depositLabel} was confirmed (${completedDepositTx.slice(0, 10)}…) but gas delivery failed: ${base}. Save the transaction hash if you need support.`
        : base;
      showToast({
        variant: "error",
        title: messages.pump.failedTitle,
        message,
        persist: true,
      });
      setPumpFlow({
        phase: "error",
        title: messages.pump.failedTitle,
        detail: message,
      });
    } finally {
      if (statusToastIdRef.current) {
        dismissToast(statusToastIdRef.current);
        statusToastIdRef.current = null;
      }
      setIsLoading(false);
    }
  }, [
    quote,
    autoFeeOn,
    autoFeeQuote,
    autoFeePath,
    walletClient,
    runLocked,
    selectedAmount,
    selectedAsset,
    trimmedTarget,
    writeContractAsync,
    sendTransactionAsync,
    switchChainAsync,
    walletChainId,
    showToast,
    dismissToast,
    dismissByVariant,
    presentPumpSuccess,
    startFuelSession,
    setFuelingHint,
    collectorAddress,
    depositTarget,
    refetchUsdc,
    publicClient,
    ensureEvmDepositChain,
    paymentEvmAddress,
    ctxEvmConnected,
    connector,
    solanaPublicKey,
    solanaSendTransaction,
    pumpPassSilent,
    priceSnapshot,
  ]);

  const handlePrimaryAction = useCallback(() => {
    if (actionMode !== "fire" || isLoading || isLocked || firingRef.current) return;
    firingRef.current = true;
    if (successToastIdRef.current) {
      dismissToast(successToastIdRef.current);
      successToastIdRef.current = null;
    }
    void pumpGas().finally(() => {
      firingRef.current = false;
    });
  }, [actionMode, isLoading, isLocked, pumpGas, dismissToast]);

  const selectAmount = useCallback((_: AmountOption) => {
    /* sabit paket kaldırıldı */
  }, []);

  const selectDepositNetwork = useCallback((key: string) => {
    setSelectedDepositKey(key);
  }, []);

  return {
    desiredAmountInput,
    setDesiredAmountInput,
    amountInvalidHint,
    selectedAmount,
    isBelowMinimumBalance,
    balanceWarning,
    selectedAsset,
    setSelectedAsset: selectDeliveryAsset,
    targetAddress,
    setTargetAddress,
    selectedDepositKey,
    setSelectedDepositKey: selectDepositNetwork,
    allDepositNetworks: paymentRows,
    allPaymentAssets,
    displayAssets,
    spendableAssets,
    usdcScanLoading,
    walletKind,
    evmConnected,
    solanaConnected,
    anyConnected,
    selectedChainUsdc,
    selectedPaymentUsd,
    priceSnapshot,
    depositChainName,
    depositTarget,
    quote,
    quoteLoading,
    oracleSource,
    marketPrices,
    lastUpdated,
    isConnected: anyConnected,
    isLoading,
    isPumping: isLoading,
    isLocked,
    handlePrimaryAction,
    actionMode,
    pumpButtonBlockReason,
    pumpBlockDetail,
    pumpFlow,
    clearPumpResult,
    isPreparing,
    prepareMessage,
    isTargetMismatch,
    isUiDisabled: isLoading || isLocked,
    autoFeeQuote,
    autoQuoteLoading,
    autoFeePath,
    isAutoFeeEnabled: autoFeeOn,
    selectedPaymentUsd,
    priceSnapshot,
  };
}
