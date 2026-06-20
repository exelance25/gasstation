"use client";

import type { PaymentAssetRow } from "../../hooks/usePaymentPortfolio";
import { usePaymentPortfolio } from "../../hooks/usePaymentPortfolio";
import { formatPackageUsd } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type TopBalanceProps = {
  selectedDepositKey?: string | null;
  networks?: PaymentAssetRow[];
};

function rowLabel(row: PaymentAssetRow): string {
  if (row.paymentMode === "native") {
    return `${row.paySymbol} · ${row.chainName}`;
  }
  return `USDC · ${row.chainName}`;
}

export function TopBalance({ selectedDepositKey = null, networks }: TopBalanceProps) {
  const hook = usePaymentPortfolio();
  const {
    anyConnected,
    isLoading,
    allPaymentAssets: hookAssets,
    walletKind,
  } = hook;

  const allPaymentAssets = networks ?? hookAssets;
  const selectedRow =
    selectedDepositKey != null
      ? allPaymentAssets.find((row) => row.key === selectedDepositKey) ?? null
      : null;

  const primaryAmount = selectedRow?.amount ?? 0;
  const primarySymbol = selectedRow?.paySymbol ?? "—";
  const primaryLabel = selectedRow ? rowLabel(selectedRow) : "Ödeme kaynağı seçin";

  const withBalance = allPaymentAssets.filter((b) => b.amount > 0);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-white">
          {selectedRow ? "Seçili ödeme" : "Bakiye özeti"}
        </p>
        <p className="text-[11px] text-neutral-500">canlı fiyat</p>
      </div>

      <div className="rounded-2xl bg-white/[0.03] px-4 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md">
        {!anyConnected ? (
          <p className="text-lg font-medium tabular-nums text-neutral-500">Cüzdan bağlı değil</p>
        ) : (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
              {primaryLabel}
            </p>
            <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-white">
              {isLoading
                ? "…"
                : `${primaryAmount.toFixed(primarySymbol === "USDC" ? 2 : primarySymbol === "SOL" ? 4 : 6)} ${primarySymbol}`}
            </p>
            {walletKind && (
              <p className="mt-1 text-[10px] text-neutral-600">
                {walletKind === "hybrid"
                  ? "EVM + Solana"
                  : walletKind === "evm"
                    ? "EVM cüzdan"
                    : "Solana cüzdan"}
              </p>
            )}
            {withBalance.length > 1 && (
              <p className="mt-1 text-[10px] text-neutral-500">
                {withBalance
                  .slice(0, 4)
                  .map((b) => `${rowLabel(b)} ${b.amount.toFixed(b.paySymbol === "USDC" ? 2 : 4)}`)
                  .join(" · ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
