"use client";

import { BadgeCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DEMO_WALLET_ROWS } from "@/lib/demo-portfolio";
import { WalletRowIconBadge } from "@/components/brand/chain-icons";
import { useTekBakiyeStore } from "@/lib/store";
import { formatFiat } from "@/utils/format";

export function WalletPortfolio() {
  const { t } = useTranslation();
  const totalBalanceUSD = useTekBakiyeStore((s) => s.totalBalanceUSD);
  const isPreviewMode = useTekBakiyeStore((s) => s.isPreviewMode);
  const balance = totalBalanceUSD ?? 0;

  return (
    <div className="space-y-4">
      <section className="embossed rounded-3xl bg-white/45 px-4 py-4 backdrop-blur-sm">
        <p className="text-sm font-medium text-monad-ink/70">{t("spendableBalance")}</p>
        <p className="mt-1 text-3xl font-bold text-monad-ink">{formatFiat(balance * 0.98, "USD")}</p>
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-monad-ink">{t("myWallets")}</h2>
        <ul className="space-y-2">
          {DEMO_WALLET_ROWS.map((row) => (
            <li key={row.id} className="embossed rounded-2xl bg-white/50 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <WalletRowIconBadge icon={row.icon} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate font-semibold text-monad-ink">{row.label}</p>
                    <BadgeCheck size={14} className="shrink-0 text-monad-500" />
                  </div>
                  {row.subtitle && <p className="text-xs text-monad-ink/60">{row.subtitle}</p>}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-monad-ink">{formatFiat(row.value, "USD")}</p>
                  <p className={`text-xs ${row.change >= 0 ? "text-positive" : "text-negative"}`}>
                    {row.change >= 0 ? "+" : ""}
                    {formatFiat(row.change, "USD")}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {isPreviewMode && (
          <p className="mt-3 text-center text-xs text-monad-ink/55">{t("previewTokensHint")}</p>
        )}
      </section>
    </div>
  );
}
