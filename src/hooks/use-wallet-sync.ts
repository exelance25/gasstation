"use client";

import { useEffect, useRef } from "react";
import { useAccount, useConnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTekBakiyeStore } from "@/lib/store";
import { useToastStore } from "@/stores/use-toast-store";

/** Syncs wagmi + Solana connections into Zustand via addWallet. */
export function useWalletSync() {
  const addWallet = useTekBakiyeStore((s) => s.addWallet);
  const removeWallet = useTekBakiyeStore((s) => s.removeWallet);
  const showToast = useToastStore((s) => s.show);

  const { address, isConnected, connector } = useAccount();
  const solana = useWallet();

  const prevEvm = useRef<string | null>(null);
  const prevSolana = useRef<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      const name = connector?.name ?? "MetaMask";
      addWallet({ address, chain: "evm", walletName: name });
      if (prevEvm.current !== address) {
        showToast(`${name} cüzdanın bağlandı`);
        prevEvm.current = address;
      }
    } else if (prevEvm.current) {
      removeWallet(prevEvm.current, "evm");
      prevEvm.current = null;
    }
  }, [isConnected, address, connector?.name, addWallet, removeWallet, showToast]);

  useEffect(() => {
    const solAddress = solana.publicKey?.toBase58();
    if (solana.connected && solAddress) {
      const name = solana.wallet?.adapter.name ?? "Phantom";
      addWallet({ address: solAddress, chain: "solana", walletName: name });
      if (prevSolana.current !== solAddress) {
        showToast(`${name} cüzdanın bağlandı`);
        prevSolana.current = solAddress;
      }
    } else if (prevSolana.current) {
      removeWallet(prevSolana.current, "solana");
      prevSolana.current = null;
    }
  }, [
    solana.connected,
    solana.publicKey,
    solana.wallet?.adapter.name,
    addWallet,
    removeWallet,
    showToast
  ]);
}

/** Re-export connect helpers for WalletConnectSheet */
export function useEvmWalletConnect() {
  return useConnect();
}
