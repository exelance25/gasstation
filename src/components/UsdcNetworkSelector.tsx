"use client";

import type { PaymentAssetRow } from "../../hooks/usePaymentPortfolio";
import { formatPackageUsd } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type UsdcNetworkSelectorProps = {
  networks: PaymentAssetRow[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  selectedPackageUsd?: number;
  walletKind?: "evm" | "solana" | "hybrid" | null;
  nativePaymentMode?: boolean;
  label?: string;
};

function rowLabel(row: PaymentAssetRow): string {
  if (row.paymentMode === "native") {
    return `${row.paySymbol} · ${row.chainName}`;
  }
  return `USDC · ${row.chainName}`;
}

export function UsdcNetworkSelector({
  networks,
  selectedKey,
  onSelect,
  isLoading = false,
  disabled = false,
  selectedPackageUsd,
  walletKind,
  nativePaymentMode = false,
  label,
}: UsdcNetworkSelectorProps) {
  const visible = networks.filter((row) =>
    nativePaymentMode ? row.paymentMode === "native" : row.paymentMode === "usdc",
  );

  if (isLoading && visible.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.03] px-4 py-6 text-center text-sm text-neutral-500">
        Bakiyeler taranıyor…
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 px-4 py-4 text-center text-[11px] text-amber-300/90">
        {nativePaymentMode
          ? "Native ödeme için ETH, BASE, MON veya SOL bakiyesi bulunamadı."
          : walletKind === "solana"
            ? "Solana cüzdanınızda USDC bulunamadı."
            : "Desteklenen ağlarda USDC bulunamadı."}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {label ?? (nativePaymentMode ? "Ödeme kaynağı (native)" : "Ödeme kaynağı (USDC)")}
        </p>
        <p className="mt-0.5 text-[10px] text-neutral-600">
          {nativePaymentMode
            ? "ETH, BASE, MON veya SOL ile öde"
            : "Hangi ağdaki USDC ile ödeyeceğinizi seçin"}
        </p>
      </div>

      <ul className="flex flex-col gap-2" role="listbox" aria-label="Ödeme kaynakları">
        {visible.map((row) => {
          const active = selectedKey === row.key;
          const canPayPackage =
            nativePaymentMode ||
            selectedPackageUsd === undefined ||
            row.amount >= selectedPackageUsd;
          const rowDisabled = disabled;
          const decimals = row.paySymbol === "USDC" ? 2 : row.paySymbol === "SOL" ? 4 : 6;

          return (
            <li key={row.key}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                disabled={rowDisabled}
                onClick={() => onSelect(row.key)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition",
                  active
                    ? "border-emerald-500/50 bg-emerald-950/30 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                    : "border-white/[0.06] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]",
                  rowDisabled && !active && "cursor-not-allowed opacity-45",
                )}
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-bold tracking-wide",
                      active ? "text-emerald-300" : "text-white",
                    )}
                  >
                    {rowLabel(row)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "text-base font-bold tabular-nums",
                      row.amount > 0 ? "text-white" : "text-neutral-600",
                    )}
                  >
                    {row.amount.toFixed(decimals)} {row.paySymbol}
                  </p>
                  {selectedPackageUsd !== undefined && row.amount > 0 && !canPayPackage && (
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
    </div>
  );
}
