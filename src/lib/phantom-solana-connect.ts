import type { Wallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import {
  connectPhantomSolanaWithApproval,
  syncPhantomSolanaAdapter,
} from "@/lib/phantom-hybrid";

export async function connectPhantomSolanaFromWallets(
  wallets: Wallet[],
  select: (walletName: WalletName | null) => void,
): Promise<string> {
  const entry = wallets.find((w) => w.adapter.name === "Phantom");
  if (!entry) {
    throw new Error("Phantom extension bulunamadı");
  }
  if (
    entry.readyState !== WalletReadyState.Installed &&
    entry.readyState !== WalletReadyState.Loadable
  ) {
    throw new Error("Phantom hazır değil — eklentiyi tarayıcıda açın");
  }

  return connectPhantomSolanaWithApproval(select, entry.adapter);
}

export { syncPhantomSolanaAdapter };
