"use client";

import { useCallback, useState } from "react";
import type { FeeQuote, PaymentToken, SupportedChain } from "@gasstation/fee-sdk";

const API_BASE =
  process.env.NEXT_PUBLIC_FEE_SDK_API_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3000/api";

export function useAutoFeeQuote() {
  const [quote, setQuote] = useState<FeeQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(
    async (params: {
      chain: SupportedChain;
      paymentToken: PaymentToken;
      gasEstimateWei: string;
      userAddress?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/v1/quote/fee`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const data = (await res.json()) as FeeQuote & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Quote alınamadı");
        setQuote(data);
        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Quote hatası";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { quote, loading, error, fetchQuote };
}
