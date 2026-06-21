"use client";

import { useState } from "react";
import { useWalletContext } from "@/providers/WalletContext";
import { UnifiedWalletModal } from "@/components/UnifiedWalletModal";
import { messages } from "@/i18n/messages";

type DepositWalletConnectProps = {
  evmConnected: boolean;
  solanaConnected: boolean;
  disabled?: boolean;
};

export function DepositWalletConnect({
  evmConnected,
  solanaConnected,
  disabled = false,
}: DepositWalletConnectProps) {
  const { disconnectAllWallets, evmAddress } = useWalletContext();
  const [modalOpen, setModalOpen] = useState(false);

  const connected = evmConnected || solanaConnected;
  const displayAddr =
    evmConnected && evmAddress
      ? `${evmAddress.slice(0, 6)}…${evmAddress.slice(-4)}`
      : "";

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        {connected && displayAddr ? (
          <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3.5 text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">
              {messages.wallet.connectedLabel}
            </p>
            <p className="mt-1 font-mono text-sm font-bold text-emerald-100">{displayAddr}</p>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setModalOpen(true)}
              className="mt-2 text-[11px] text-neutral-400 underline-offset-2 hover:text-amber-200/90 hover:underline disabled:opacity-50"
            >
              {messages.wallet.useDifferent}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setModalOpen(true)}
            className="w-full rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/40 to-emerald-900/20 px-4 py-3.5 text-sm font-semibold tracking-wide text-emerald-100 shadow-[0_0_28px_rgba(16,185,129,0.12)] transition hover:border-emerald-400/40 disabled:opacity-50"
          >
            {messages.wallet.connectCta}
          </button>
        )}

        {connected && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void disconnectAllWallets()}
            className="mt-0.5 w-full rounded-xl border border-red-500/45 bg-red-950/30 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-red-300 shadow-[0_0_16px_rgba(239,68,68,0.12)] transition hover:border-red-400/60 hover:bg-red-950/50 hover:text-red-200 disabled:opacity-50"
          >
            {messages.wallet.disconnect}
          </button>
        )}
      </div>

      <UnifiedWalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
