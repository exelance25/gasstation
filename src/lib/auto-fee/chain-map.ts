import type { DepotAssetId } from "@/config/depot-assets";
import { clientEnv } from "@/config/client-env";
import type { DepositNetworkRow } from "../../../hooks/useDepositUsdcBalance";
import type { PaymentToken, SupportedChain } from "@pumpstation/fee-sdk";

const EVM_CHAIN_MAP: Record<number, SupportedChain> = {
  1: "ethereum",
  11155111: "ethereum-sepolia",
  8453: "base",
  84532: "base-sepolia",
  143: "monad",
  10143: "monad-testnet",
};

const BASE_CHAIN_IDS = new Set([8453, 84532]);
const MONAD_CHAIN_IDS = new Set([143, 10143]);

function isMainnet(): boolean {
  return clientEnv.NEXT_PUBLIC_APP_ENV === "mainnet";
}

/** Gas teslim zinciri — seçilen varlığa göre */
export function deliveryChainForAsset(asset: DepotAssetId): SupportedChain {
  switch (asset) {
    case "MON":
      return isMainnet() ? "monad" : "monad-testnet";
    case "SOL":
      return isMainnet() ? "solana" : "solana-devnet";
    case "BASE":
      return isMainnet() ? "base" : "base-sepolia";
    case "ETH":
    default:
      return isMainnet() ? "ethereum" : "ethereum-sepolia";
  }
}

/** Ödeme tokeni — depozit ağına göre native token */
export function paymentTokenForDeposit(deposit: DepositNetworkRow): PaymentToken {
  if (deposit.kind === "solana") return "SOL";
  if (MONAD_CHAIN_IDS.has(deposit.chainId)) return "MON";
  if (BASE_CHAIN_IDS.has(deposit.chainId)) return "BASE";
  return "ETH";
}

export function supportedChainForDeposit(deposit: DepositNetworkRow): SupportedChain {
  if (deposit.kind === "solana") {
    return isMainnet() ? "solana" : "solana-devnet";
  }
  return EVM_CHAIN_MAP[deposit.chainId] ?? (isMainnet() ? "ethereum" : "ethereum-sepolia");
}

export const DEFAULT_GAS_ESTIMATE_WEI = String(21_000n * 50_000_000_000n);
