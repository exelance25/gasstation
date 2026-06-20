/** Hedef adres validasyon — seçilen gas projesine göre */
import type { DepotAssetId } from "@/config/depot-assets";

/** EVM: 0x + 40 hex (42 karakter) */
export const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/** Solana Base58: 32–44 karakter, 0/O/I/l yok */
export const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const TARGET_FORMAT_ERROR =
  "Hata: Seçilen ağ ile hedef adres formatı uyumsuz!";

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

/** Dolu girdi + format uyumsuzluğu */
export function isTargetFormatMismatch(
  asset: DepotAssetId,
  raw: string,
): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return !isValidDeliveryTarget(asset, trimmed);
}

export function deliveryTargetHint(asset: DepotAssetId): string {
  if (asset === "SOL") {
    return "Solana Base58 adresi (32–44 karakter).";
  }
  return "EVM adresi: 0x ile başlayan 42 karakter.";
}
