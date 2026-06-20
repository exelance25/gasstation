"use client";

import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUnifiedBalance } from "@/hooks/use-unified-balance";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFiat } from "@/utils/format";

export function UnifiedBalanceCard() {
  const { t } = useTranslation();
  const { balance, loading, refresh } = useUnifiedBalance();

  return (
    <section className="glass relative overflow-hidden rounded-4xl p-6 shadow-glow">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-light opacity-60 blur-2xl" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("oneBalance")}</p>
          {loading ? (
            <Skeleton className="mt-3 h-12 w-52" />
          ) : (
            <p className="mt-2 text-4xl font-bold text-foreground">{formatFiat(balance.fiat, balance.currency)}</p>
          )}
          <p className="mt-2 text-sm text-primary/70">{loading ? t("loading") : t("balanceSubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="glass tap-fast rounded-2xl p-2.5 text-primary"
          aria-label="Refresh balance"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-600">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        {t("encrypted")}
      </div>
    </section>
  );
}
