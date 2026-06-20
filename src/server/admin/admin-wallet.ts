import "server-only";

import { isAddress } from "viem";

/** Sunucu-only — asla NEXT_PUBLIC_ kullanmayın. */
export function getAdminWalletAddress(): `0x${string}` | null {
  const raw = process.env.ADMIN_WALLET_ADDRESS?.trim();
  if (!raw || !isAddress(raw)) return null;
  return raw as `0x${string}`;
}

export function isAdminWalletAddress(address: string | undefined | null): boolean {
  if (!address) return false;
  const admin = getAdminWalletAddress();
  if (!admin) return false;
  return address.toLowerCase() === admin.toLowerCase();
}

export function isAdminConfigured(): boolean {
  return getAdminWalletAddress() !== null;
}
