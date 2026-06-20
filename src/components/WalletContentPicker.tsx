"use client";

import { useEffect, useRef, useState } from "react";
import type { PaymentAssetRow } from "../../hooks/usePaymentPortfolio";
import { formatPackageUsd } from "@/lib/pricing";
import type { LivePrices } from "@/lib/oracle/live-prices";
import { rowUsdValue } from "@/lib/payment-portfolio-filter";
import { cn } from "@/lib/utils";

type WalletContentPickerProps = {
  assets: PaymentAssetRow[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  selectedPackageUsd?: number;
  paymentPrices?: LivePrices;
  /** Bağlıyken boş liste de göster (tarama / bakiye yok mesajı) */
  showWhenEmpty?: boolean;
};

function rowLabel(row: PaymentAssetRow): string {
  if (row.paymentMode === "native") {
    return `${row.paySymbol} · ${row.chainName}`;
  }
  return `USDC · ${row.chainName}`;
}

function formatRowAmount(row: PaymentAssetRow): string {
  const decimals = row.paySymbol === "USDC" ? 2 : row.paySymbol === "SOL" ? 4 : 6;
  return `${row.amount.toFixed(decimals)} ${row.paySymbol}`;
}

export function WalletContentPicker({
  assets,
  selectedKey,
  onSelect,
  isLoading = false,
  disabled = false,
  selectedPackageUsd,
  paymentPrices,
  showWhenEmpty = false,
}: WalletContentPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedRow =
    selectedKey != null ? assets.find((row) => row.key === selectedKey) ?? null : null;

  const sortedAssets = [...assets].sort((a, b) => b.amount - a.amount);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleSelect = (key: string) => {
    onSelect(key);
    setOpen(false);
  };

  if (!showWhenEmpty && assets.length === 0 && !isLoading) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition",
          open
            ? "border-emerald-500/40 bg-emerald-950/25"
            : "border-white/[0.08] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Cüzdan içeriği
          </p>
          <p className="mt-0.5 truncate text-sm font-bold text-white">
            {isLoading
              ? "Taranıyor…"
              : selectedRow
                ? rowLabel(selectedRow)
                : "Ödeme kaynağı seçin"}
          </p>
          {selectedRow && !isLoading && (
            <p className="mt-0.5 text-xs tabular-nums text-emerald-400/90">
              {formatRowAmount(selectedRow)}
            </p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 text-neutral-500 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Cüzdan içeriği"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[120] max-h-[min(60vh,320px)] overflow-y-auto rounded-2xl border border-white/10 bg-neutral-950/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.75)] backdrop-blur-xl"
        >
          {isLoading && sortedAssets.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-neutral-500">Bakiyeler taranıyor…</p>
          ) : sortedAssets.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-amber-300/90">
              USDC, ETH, BASE veya MON bakiyesi bulunamadı. Sepolia / Base Sepolia / Monad
              ağında token olduğundan emin olun.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {sortedAssets.map((row) => {
                const active = selectedKey === row.key;
                const rowUsd =
                  row.paySymbol === "USDC" || !paymentPrices
                    ? row.amount
                    : rowUsdValue(row, paymentPrices);
                const canPayPackage =
                  selectedPackageUsd === undefined || rowUsd >= selectedPackageUsd;
                const decimals = row.paySymbol === "USDC" ? 2 : row.paySymbol === "SOL" ? 4 : 6;

                return (
                  <li key={row.key}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={disabled}
                      onClick={() => handleSelect(row.key)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                        active
                          ? "border-emerald-500/50 bg-emerald-950/40"
                          : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]",
                      )}
                    >
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-sm font-bold",
                            active ? "text-emerald-300" : "text-white",
                          )}
                        >
                          {rowLabel(row)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            row.amount > 0 ? "text-white" : "text-neutral-600",
                          )}
                        >
                          {row.amount.toFixed(decimals)} {row.paySymbol}
                        </p>
                        {selectedPackageUsd !== undefined &&
                          row.amount > 0 &&
                          !canPayPackage && (
                            <p className="text-[9px] text-amber-400/90">
                              {formatPackageUsd(selectedPackageUsd)} için yetersiz
                            </p>
                          )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
