import type { DepotAssetId } from "@/config/depot-assets";
import type { DepositNetworkRow } from "../../../hooks/useDepositUsdcBalance";
import type { ManuelGasTarget } from "@/lib/oracle/calculate-manuel-gas-out";
import { isPaymasterDeployed } from "@/lib/paymaster-config";
import { getPaymasterChainId } from "@/lib/paymaster-config";
import { isFeeTokenConfigured } from "@/config/pool-tokens";
import { isNativeTreasuryConfigured } from "./treasury-native";

export type AutoFeePath = "native_settlement" | "paymaster_usdc" | "erc4337_relay";

export function manuelTargetForAsset(asset: DepotAssetId): ManuelGasTarget | null {
  if (asset === "MON") return "MON";
  if (asset === "ETH" || asset === "BASE") return "ETH";
  return null;
}

export function resolveAutoFeePath(params: {
  deposit: DepositNetworkRow | null;
  selectedAsset: DepotAssetId;
  selectedAmountUsd: number;
  hasEnoughNative: boolean;
  usdcBalance: number;
  relayerEnabled: boolean;
  isSmartAccount: boolean;
}): AutoFeePath | null {
  const deposit = params.deposit;
  if (!deposit) return null;

  if (deposit.kind === "solana") {
    return params.hasEnoughNative && isNativeTreasuryConfigured(deposit)
      ? "native_settlement"
      : null;
  }

  const onPaymasterChain = deposit.chainId === getPaymasterChainId();
  const paymasterReady = onPaymasterChain && isPaymasterDeployed() && isFeeTokenConfigured();
  const manuelTarget = manuelTargetForAsset(params.selectedAsset);
  const hasUsdc = params.usdcBalance >= params.selectedAmountUsd;

  if (params.hasEnoughNative && isNativeTreasuryConfigured(deposit)) {
    return "native_settlement";
  }

  if (paymasterReady && manuelTarget && hasUsdc) {
    if (params.relayerEnabled && params.isSmartAccount) {
      return "erc4337_relay";
    }
    return "paymaster_usdc";
  }

  return null;
}

export function autoFeePathLabel(path: AutoFeePath): string {
  switch (path) {
    case "native_settlement":
      return "Native token → Settlement";
    case "paymaster_usdc":
      return "USDC → PumpPaymaster";
    case "erc4337_relay":
      return "Gasless · ERC-4337 relayer";
  }
}
