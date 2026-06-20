import { getCollectorAddress } from "@/lib/treasury-config";
import { getSolanaCollectorAddress } from "@/config/solana-usdc";
import type { DepositNetworkRow } from "../../../hooks/useDepositUsdcBalance";

/** Native token ödemeleri için kasa adresi */
export function getNativeTreasuryAddress(deposit: DepositNetworkRow): string | null {
  if (deposit.kind === "solana") {
    return getSolanaCollectorAddress();
  }
  return getCollectorAddress();
}

export function isNativeTreasuryConfigured(deposit: DepositNetworkRow | null): boolean {
  if (!deposit) return false;
  return Boolean(getNativeTreasuryAddress(deposit));
}
