import { isAddress, type Address } from "viem";
import { clientEnv } from "@/config/client-env";
import { getPumpPaymasterAddress } from "@/lib/paymaster-config";

function parseOptionalAddress(value: string | undefined): Address | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (!isAddress(trimmed)) return null;
  return trimmed;
}

/** USDC depozit toplama kasası — öncelik: COLLECTOR_ADDRESS */
export function getCollectorAddress(): Address | null {
  const collector = parseOptionalAddress(clientEnv.NEXT_PUBLIC_COLLECTOR_ADDRESS);
  if (collector) return collector;
  return getTreasuryAddress();
}

export function isCollectorConfigured(): boolean {
  return getCollectorAddress() !== null;
}

/** @deprecated getCollectorAddress kullanın */
export function getTreasuryAddress(): Address | null {
  const dedicated = parseOptionalAddress(clientEnv.NEXT_PUBLIC_PUMP_TREASURY_ADDRESS);
  if (dedicated) return dedicated;
  return getPumpPaymasterAddress();
}

export function isTreasuryConfigured(): boolean {
  return isCollectorConfigured();
}
