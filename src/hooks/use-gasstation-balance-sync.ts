"use client";

import { useCallback, useEffect } from "react";
import { useTekBakiyeStore } from "@/lib/store";

/**
 * Subscribes to connectedWallets and refreshes GASSTATION balance.
 * First load: visible skeleton. Later: silent background refresh.
 */
export function useGasStationBalanceSync() {
  const fetchTotalBalance = useTekBakiyeStore((s) => s.fetchTotalBalance);

  const fetchInitial = useCallback(() => {
    void fetchTotalBalance({ silent: false });
  }, [fetchTotalBalance]);

  const fetchSilent = useCallback(() => {
    void fetchTotalBalance({ silent: true });
  }, [fetchTotalBalance]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  useEffect(() => {
    const unsubscribe = useTekBakiyeStore.subscribe((state, prevState) => {
      const changed =
        JSON.stringify(state.connectedWallets) !== JSON.stringify(prevState.connectedWallets);
      if (changed && state.hasInitialBalanceLoad) {
        fetchSilent();
      }
    });
    return unsubscribe;
  }, [fetchSilent]);
}
