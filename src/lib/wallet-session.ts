/** Cüzdan oturumu / önbellek temizliği — wagmi shim bayrakları korunur */

import { disconnectPhantomExtension } from "@/lib/injected-provider";
import { walletService } from "@/wallets/wallet-service";

const PERSISTENCE_PREFIXES = [
  "rk-",
  "@solana/wallet-adapter",
  "walletName",
  "onebalance.wallet",
] as const;

const PERSISTENCE_EXACT_KEYS = new Set([
  "walletName",
  "injected.connected",
  "rk-recent",
  "rk-version",
  "pumpstation_sol_wallet",
]);

/** wagmi shimDisconnect bayrakları — asla silme (ör. phantom.disconnected) */
function isWagmiShimKey(key: string): boolean {
  return key.endsWith(".disconnected") || key.startsWith("wagmi.");
}

function shouldPurgeKey(key: string): boolean {
  if (isWagmiShimKey(key)) return false;
  if (PERSISTENCE_EXACT_KEYS.has(key)) return true;
  if (PERSISTENCE_PREFIXES.some((prefix) => key.startsWith(prefix))) return true;
  const lower = key.toLowerCase();
  if (lower.includes("walletconnect") || lower.includes("wc@")) return true;
  return false;
}

function collectKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && shouldPurgeKey(key)) keys.push(key);
  }
  return keys;
}

export function purgeWalletPersistence(): void {
  if (typeof window === "undefined") return;

  for (const storage of [localStorage, sessionStorage]) {
    for (const key of collectKeys(storage)) {
      try {
        storage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }
}

/** @deprecated disconnectPhantomExtension kullanın */
export async function disconnectPhantomSolana(): Promise<void> {
  await disconnectPhantomExtension();
}

/** Tüm injected provider'larda izin iptali — yalnızca tam reset için */
export async function revokeInjectedWalletPermissions(): Promise<void> {
  await disconnectPhantomExtension();

  if (typeof window === "undefined") return;

  const win = window as Window & {
    ethereum?: {
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      providers?: { request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> }[];
    };
  };

  const providers = win.ethereum?.providers?.length
    ? win.ethereum.providers
    : win.ethereum
      ? [win.ethereum]
      : [];

  await Promise.all(
    providers.map(async (provider: { request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> }) => {
      if (!provider.request) return;
      try {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        /* ignore */
      }
    }),
  );
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Kullanıcı bu oturumda bilinçli bağlandı mı — wagmi önbelleği tek başına UI'da bağlı göstermez */
const WALLET_ACTIVE_KEY = "pump_wallet_user_active";
export const WALLET_IDLE_MS = 5 * 60 * 1000;

export function touchWalletActiveSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WALLET_ACTIVE_KEY, String(Date.now()));
}

export function isWalletActiveSession(): boolean {
  if (typeof window === "undefined") return false;
  const raw = sessionStorage.getItem(WALLET_ACTIVE_KEY);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < WALLET_IDLE_MS;
}

export function clearWalletActiveSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(WALLET_ACTIVE_KEY);
}

export async function hardResetWalletSession(): Promise<void> {
  walletService.clear();
  purgeWalletPersistence();
  await disconnectPhantomExtension();
  await revokeInjectedWalletPermissions();
  await delay(200);
}
