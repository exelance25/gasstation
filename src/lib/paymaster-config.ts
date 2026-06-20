import { isAddress, type Address } from "viem";
import { clientEnv } from "@/config/client-env";
import { PAYMENT_CHAIN_ID } from "@config/evm-chains";

/** ERC-4337 EntryPoint v0.6 — Base / Base Sepolia */
export const DEFAULT_ENTRY_POINT_V06 =
  "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789" as const;

function parseOptionalAddress(value: string | undefined): Address | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (!isAddress(trimmed)) return null;
  return trimmed;
}

export function getPumpPaymasterAddress(): Address | null {
  return parseOptionalAddress(clientEnv.NEXT_PUBLIC_PUMP_PAYMASTER_ADDRESS);
}

export function getPaymasterChainId(): number {
  return PAYMENT_CHAIN_ID;
}

export function getEntryPointAddress(): Address {
  return (
    parseOptionalAddress(clientEnv.NEXT_PUBLIC_ENTRY_POINT_ADDRESS) ??
    DEFAULT_ENTRY_POINT_V06
  );
}

export function isPaymasterDeployed(): boolean {
  return getPumpPaymasterAddress() !== null;
}
