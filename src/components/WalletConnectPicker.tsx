"use client";

import { useEffect, useRef } from "react";
import { useConnectors } from "wagmi";
import type { Connector } from "wagmi";
import { getConnectorLabel, getWalletConnectors } from "@/lib/connectors";

interface WalletConnectPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (connector: Connector) => void;
  title?: string;
}

/**
 * Cüzdan seçim menüsü — tıklanınca MetaMask / Rabby vb. listeler.
 */
export function WalletConnectPicker({
  open,
  onClose,
  onSelect,
  title = "Cüzdan Seçin",
}: WalletConnectPickerProps) {
  const connectors = useConnectors();
  const list = getWalletConnectors(connectors);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        ref={panelRef}
        className="w-full max-w-sm rounded-xl border border-neon-purple/50 bg-charcoal p-4 shadow-neon-purple"
        role="dialog"
        aria-label={title}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {list.length === 0 ? (
          <p className="text-xs text-gray-400">
            Cüzdan bulunamadı. MetaMask veya Rabby kurun ve sayfayı yenileyin.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((connector) => (
              <li key={connector.uid}>
                <button
                  type="button"
                  onClick={() => onSelect(connector)}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-left transition hover:border-neon-purple/60 hover:bg-neon-purple/15 hover:shadow-neon-purple"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neon-purple/20 text-xs font-bold text-neon-purple">
                    {getConnectorLabel(connector).slice(0, 2).toUpperCase()}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">
                      {getConnectorLabel(connector)}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {connector.type === "walletConnect" ? "WalletConnect" : "EVM"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
