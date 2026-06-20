"use client";

import { useTranslation } from "react-i18next";
import { useTekBakiyeStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedBalance } from "@/components/core/animated-balance";

type BalanceHeroProps = {
  onConnectWallet?: () => void;
};

export function BalanceHero({ onConnectWallet }: BalanceHeroProps) {
  const { t } = useTranslation();
  const totalBalanceUSD = useTekBakiyeStore((s) => s.totalBalanceUSD);
  const isLoading = useTekBakiyeStore((s) => s.isLoading);
  const hasInitialBalanceLoad = useTekBakiyeStore((s) => s.hasInitialBalanceLoad);
  const isPreviewMode = useTekBakiyeStore((s) => s.isPreviewMode);
  const hasWallets = useTekBakiyeStore((s) => s.connectedWallets.length > 0);

  const showSkeleton = isLoading && !hasInitialBalanceLoad;

  return (
    <section className="balance-panel px-3 py-6 text-center">
      {showSkeleton ? (
        <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
          <Skeleton className="h-14 w-56 rounded-2xl bg-white/30" />
          <Skeleton className="h-3 w-32 rounded-full bg-white/25" />
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-monad-600/55">
            {t("oneBalance")}
          </p>
          <AnimatedBalance value={totalBalanceUSD ?? 0} />
          <p className="mt-4 text-sm font-medium text-monad-ink/55">{t("balanceSubtitle")}</p>
          {isPreviewMode && (
            <span className="mt-3 inline-block rounded-full border border-monad-400/25 bg-white/30 px-3 py-1 text-[11px] font-medium text-monad-600/80 backdrop-blur-sm">
              {t("previewMode")}
            </span>
          )}
          {!hasWallets && onConnectWallet && (
            <button
              type="button"
              onClick={onConnectWallet}
              className="tap-fast mt-4 text-sm font-medium text-monad-600/90 underline decoration-monad-400/50 underline-offset-4"
            >
              {t("connectWallet")}
            </button>
          )}
        </>
      )}
    </section>
  );
}
