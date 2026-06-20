"use client";

import { useCallback, useEffect, useState } from "react";
import type { LivePrices } from "@/lib/oracle/live-prices";

const POLL_MS = 10_000;

/** Adım B — ekranda saniyelik güncellenen fiyatlar */
export function useLivePrices() {
  const [prices, setPrices] = useState<LivePrices | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/oracle/prices", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as LivePrices;
        setPrices(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { prices, loading, refresh };
}
