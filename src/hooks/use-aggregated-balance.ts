"use client";

import { useCallback, useMemo } from "react";
import { useTekBakiyeStore } from "@/lib/store";

export function useAggregatedBalance() {
  const totalBalanceUSD = useTekBakiyeStore((s) => s.totalBalanceUSD);
  const isLoading = useTekBakiyeStore((s) => s.isLoading);
  const fetchTotalBalance = useTekBakiyeStore((s) => s.fetchTotalBalance);
  const hasInitialBalanceLoad = useTekBakiyeStore((s) => s.hasInitialBalanceLoad);

  const balance = useMemo(
    () => ({
      fiat: totalBalanceUSD ?? 0,
      crypto: (totalBalanceUSD ?? 0) / 3500,
      currency: "USD" as const,
      lastUpdated: new Date().toISOString()
    }),
    [totalBalanceUSD]
  );

  const refresh = useCallback(() => {
    void fetchTotalBalance({ silent: hasInitialBalanceLoad });
  }, [fetchTotalBalance, hasInitialBalanceLoad]);

  return { balance, loading: isLoading, refresh };
}
