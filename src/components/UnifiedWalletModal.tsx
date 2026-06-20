"use client";

import { useEffect, useRef, useState } from "react";
import { useConnectors } from "wagmi";
import type { Connector } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { getConnectorLabel, getWalletConnectors } from "@/lib/connectors";
import { useWalletContext } from "@/providers/WalletContext";
import { WALLET_CONNECT_CONSENT, SUPPORTED_PAY_ASSETS_TR } from "@/lib/deposit-networks";
import { isSolanaGasEnabled } from "@/config/gas-features";
import { WalletBrandIcon } from "@/components/WalletBrandIcon";
import { cn } from "@/lib/utils";

type UnifiedWalletModalProps = {
  open: boolean;
  onClose: () => void;
};

type WalletRow =
  | { kind: "evm"; id: string; label: string; sub: string; connector: Connector }
  | { kind: "solana"; id: string; label: string; sub: string; walletName: string }
  | { kind: "phantom"; id: string; label: string; sub: string; connector: Connector };

export function UnifiedWalletModal({ open, onClose }: UnifiedWalletModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const connectors = useConnectors();
  const evmConnectors = getWalletConnectors(connectors);
  const { wallets: solanaWallets, connecting: solanaConnecting } = useWallet();
  const {
    connectEvmConnector,
    connectSolanaWallet,
    connectPhantomWallet,
    evmConnected,
    evmAddress,
    solanaConnected,
  } = useWalletContext();

  const phantomEvmConnector =
    evmConnectors.find((c) => getConnectorLabel(c) === "Phantom") ?? null;

  const evmRows: WalletRow[] = evmConnectors
    .filter((c) => getConnectorLabel(c) !== "Phantom")
    .map((connector) => {
      const label = getConnectorLabel(connector);
      return {
        kind: "evm" as const,
        id: `evm-${connector.uid}`,
        label,
        sub: connector.type === "walletConnect" ? "WalletConnect" : "EVM",
        connector,
      };
    });

  const phantomRow: WalletRow | null = phantomEvmConnector
    ? {
        kind: "phantom",
        id: "phantom-hybrid",
        label: "Phantom",
        sub: "EVM onayı → Solana onayı",
        connector: phantomEvmConnector,
      }
    : null;

  const solanaRows: WalletRow[] = solanaWallets
    .filter(
      (w) =>
        w.readyState === WalletReadyState.Installed ||
        w.readyState === WalletReadyState.Loadable,
    )
    .filter((w) => !(w.adapter.name === "Phantom" && phantomEvmConnector))
    .map((w) => ({
      kind: "solana" as const,
      id: `sol-${w.adapter.name}`,
      label: w.adapter.name,
      sub: "Solana",
      walletName: w.adapter.name,
    }));

  const rows: WalletRow[] = isSolanaGasEnabled()
    ? [...(phantomRow ? [phantomRow] : []), ...evmRows, ...solanaRows]
    : evmRows;

  useEffect(() => {
    if (!open) {
      setAccepted(false);
      setConnectingId(null);
      setError(null);
      return;
    }
    const onDoc = (e: MouseEvent) => {
      if (connectingId) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose, connectingId]);

  useEffect(() => {
    if (!open) return;
    if (evmConnected && evmAddress) {
      onClose();
      return;
    }
    if (solanaConnected) {
      onClose();
    }
  }, [open, evmConnected, evmAddress, solanaConnected, onClose]);

  const handlePick = async (row: WalletRow) => {
    if (!accepted || connectingId) return;
    setConnectingId(row.id);
    setError(null);
    try {
      if (row.kind === "phantom") {
        await connectPhantomWallet(row.connector);
      } else if (row.kind === "evm") {
        await connectEvmConnector(row.connector);
      } else {
        await connectSolanaWallet(row.walletName);
      }
      onClose();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Cüzdan bağlantısı reddedildi veya başarısız";
      setError(message);
    } finally {
      setConnectingId(null);
    }
  };

  if (!open) return null;

  const busy = connectingId !== null || solanaConnecting;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Cüzdan seçin"
        className="flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
      >
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">
              Cüzdan Bağla
            </h3>
            <button
              type="button"
              onClick={onClose}
              disabled={Boolean(connectingId)}
              className="text-neutral-500 transition hover:text-white disabled:opacity-40"
              aria-label="Kapat"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-[10px] text-neutral-500">
            Ödeme: {SUPPORTED_PAY_ASSETS_TR}
          </p>
        </div>

        <label className="flex cursor-pointer gap-2.5 border-b border-white/10 px-4 py-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            disabled={Boolean(connectingId)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 accent-emerald-500"
          />
          <span className="text-[11px] leading-relaxed text-neutral-400">{WALLET_CONNECT_CONSENT}</span>
        </label>

        {error && (
          <p className="border-b border-red-500/20 bg-red-950/30 px-4 py-2 text-[11px] text-red-300">
            {error}
          </p>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-xs text-neutral-500">
              Cüzdan bulunamadı. MetaMask, Rabby veya Phantom kurun.
            </p>
          ) : (
            <ul className="space-y-2">
              {rows.map((row) => {
                const isConnecting = connectingId === row.id;
                const disabled = !accepted || busy;

                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void handlePick(row)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition",
                        disabled
                          ? "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-40"
                          : "border-white/10 bg-white/[0.03] hover:border-emerald-500/35 hover:bg-emerald-950/20",
                        isConnecting && "animate-pulse border-emerald-500/40",
                        row.kind === "phantom" && !disabled && "border-purple-500/25",
                      )}
                    >
                      <WalletBrandIcon
                        label={row.label}
                        kind={row.kind === "phantom" ? "phantom" : row.kind}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-white">{row.label}</span>
                        <span className="text-[10px] text-neutral-500">{row.sub}</span>
                      </span>
                      {isConnecting && (
                        <span className="ml-auto text-[10px] text-emerald-400">Onay bekleniyor…</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="border-t border-white/10 px-4 py-2 text-center text-[9px] text-neutral-600">
          Phantom: önce EVM, sonra Solana onayı · Adresler sunucuda saklanmaz
        </p>
      </div>
    </div>
  );
}
