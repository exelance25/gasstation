"use client";

import { SUPPORTED_PAY_SYMBOLS, type PaySymbol } from "@/config/payment-assets";
import { usePaymentPortfolio } from "../../hooks/usePaymentPortfolio";
import { cn } from "@/lib/utils";

function formatAmount(symbol: PaySymbol, amount: number): string {
  if (amount <= 0) return "—";
  if (symbol === "USDC") return amount.toFixed(2);
  if (symbol === "SOL") return amount.toFixed(4);
  return amount.toFixed(6);
}

export function PaymentPortfolioPanel() {
  const { anyConnected, portfolioSummary, isLoading } = usePaymentPortfolio();

  if (!anyConnected) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Cüzdan içeriği
        </p>
        <p className="text-[9px] text-neutral-600">ETH · BASE · MON · SOL · USDC</p>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {SUPPORTED_PAY_SYMBOLS.map((symbol) => {
          const amount = portfolioSummary[symbol] ?? 0;
          const hasBalance = amount > 0;

          return (
            <div
              key={symbol}
              className={cn(
                "rounded-xl border px-1.5 py-2 text-center",
                hasBalance
                  ? "border-emerald-500/25 bg-emerald-950/20"
                  : "border-white/[0.06] bg-white/[0.02]",
              )}
            >
              <p className="text-[9px] font-bold uppercase tracking-wide text-neutral-500">
                {symbol}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-[10px] font-bold tabular-nums leading-tight",
                  hasBalance ? "text-white" : "text-neutral-600",
                )}
              >
                {isLoading ? "…" : formatAmount(symbol, amount)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
