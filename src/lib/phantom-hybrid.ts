import type { WalletAdapter } from "@solana/wallet-adapter-base";
import type { WalletName } from "@solana/wallet-adapter-base";
import {
  disconnectPhantomSolanaFully,
  getPhantomSolanaProvider,
  revokePhantomEvmSession,
} from "@/lib/injected-provider";
import { delay, purgeWalletPersistence } from "@/lib/wallet-session";
import { SOLANA_WALLET_STORAGE_KEY } from "@/wallets/solana-config";

export function readPhantomSolanaPublicKey(): string | null {
  const phantom = getPhantomSolanaProvider();
  if (!phantom?.isConnected) return null;
  const pk = phantom.publicKey as { toBase58?: () => string; toString?: () => string } | undefined;
  if (!pk) return null;
  if (typeof pk.toBase58 === "function") return pk.toBase58();
  if (typeof pk.toString === "function") return pk.toString();
  return null;
}

/** Kullanıcı onayı — yalnızca phantom.solana.connect (tek popup) */
export async function connectPhantomSolanaWithApproval(
  select: (walletName: WalletName | null) => void,
  adapter: WalletAdapter,
): Promise<string> {
  const phantom = getPhantomSolanaProvider();
  if (!phantom?.connect) {
    throw new Error("Phantom Solana extension bulunamadı");
  }

  localStorage.removeItem(SOLANA_WALLET_STORAGE_KEY);
  purgeWalletPersistence();

  if (phantom.isConnected) {
    await disconnectPhantomSolanaFully();
    await delay(250);
  }

  const result = await phantom.connect({ onlyIfTrusted: false });
  const pubkey =
    typeof result.publicKey?.toString === "function"
      ? result.publicKey.toString()
      : readPhantomSolanaPublicKey();
  if (!pubkey) {
    throw new Error("Phantom Solana public key alınamadı");
  }

  select("Phantom" as WalletName);
  await delay(150);

  if (!adapter.connected) {
    try {
      await adapter.connect();
    } catch {
      /* phantom zaten bağlı — adapter senkron gecikebilir */
    }
  }

  return readPhantomSolanaPublicKey() ?? pubkey;
}

/** EVM bağlantısı sonrası adapter ↔ phantom senkronu (popup yok) */
export async function syncPhantomSolanaAdapter(
  select: (walletName: WalletName | null) => void,
  adapter: WalletAdapter,
): Promise<string | null> {
  const pubkey = readPhantomSolanaPublicKey();
  if (!pubkey) return null;

  select("Phantom" as WalletName);
  if (!adapter.connected) {
    try {
      await adapter.connect();
    } catch {
      /* provider bağlı — adapter state yeterli */
    }
  }
  return readPhantomSolanaPublicKey() ?? pubkey;
}

/** Phantom hibrit bağlantı öncesi hafif reset — extension UI tetiklemez */
export async function resetPhantomHybridSession(): Promise<void> {
  localStorage.removeItem(SOLANA_WALLET_STORAGE_KEY);
  purgeWalletPersistence();
  await revokePhantomEvmSession();
  const phantom = getPhantomSolanaProvider();
  if (phantom?.isConnected) {
    await disconnectPhantomSolanaFully();
    await delay(200);
  }
}
