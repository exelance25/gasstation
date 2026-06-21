import "server-only";

import { isAddress } from "viem";
import { getOperatorAddressSafe, getCollectorAddressSafe } from "@/config/operator-env";

/** Sunucu-only — asla NEXT_PUBLIC_ kullanmayın. */
export function getAdminWalletAddress(): `0x${string}` | null {
  const raw = process.env.ADMIN_WALLET_ADDRESS?.trim();
  if (raw && isAddress(raw)) return raw as `0x${string}`;

  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
  if (appEnv === "testnet" || appEnv === "development") {
    const collector = getCollectorAddressSafe();
    if (collector) return collector;
    const operator = getOperatorAddressSafe();
    if (operator) return operator;
  }

  return null;
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
