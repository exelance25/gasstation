/** Destination address validation — by selected gas asset */
import type { DepotAssetId } from "@/config/depot-assets";
import { messages } from "@/i18n/messages";

/** EVM: 0x + 40 hex (42 chars) */
export const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/** Solana Base58: 32–44 chars */
export const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const TARGET_FORMAT_ERROR = messages.target.formatError;

export type DetectedTargetKind = "evm" | "solana" | null;

export function detectTargetKind(raw: string): DetectedTargetKind {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (SOLANA_ADDRESS_REGEX.test(trimmed)) return "solana";
  if (EVM_ADDRESS_REGEX.test(trimmed)) return "evm";
  return null;
}

export function isValidDeliveryTarget(
  asset: DepotAssetId,
  raw: string,
): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (asset === "SOL") return SOLANA_ADDRESS_REGEX.test(trimmed);
  return EVM_ADDRESS_REGEX.test(trimmed);
}

export function isTargetFormatMismatch(
  asset: DepotAssetId,
  raw: string,
): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return !isValidDeliveryTarget(asset, trimmed);
}

export function deliveryTargetHint(asset: DepotAssetId): string {
  if (asset === "SOL") return messages.target.solHint;
  return messages.target.evmHint;
}
