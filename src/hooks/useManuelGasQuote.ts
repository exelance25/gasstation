"use client";

import { useEffect, useState } from "react";
import {
  calculateManuelGasOut,
  type ManuelGasTarget,
  type ManuelGasQuote,
} from "@/lib/oracle/calculate-manuel-gas-out";

export function useManuelGasQuote(
  usdcAmount: string,
  targetToken: ManuelGasTarget,
) {
  const [quote, setQuote] = useState<ManuelGasQuote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const paid = Number(usdcAmount);
    if (!usdcAmount || !Number.isFinite(paid) || paid <= 0) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void calculateManuelGasOut(paid, targetToken)
      .then((result) => {
        if (!cancelled) setQuote(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [usdcAmount, targetToken]);

  return { quote, loading };
}
