"use client";

import { useEffect, useRef } from "react";
import { fetchPumpPass, issuePumpPass, type PumpPassResponse } from "@/lib/api/gas-ticket";

/**
 * Arka plan giriş bileti (GP-…) — kullanıcıya gösterilmez.
 * Sipariş anında sunucu pass doğrular; yoksa intent route yeni pass üretir.
 */
export function usePumpPassSilent(evmAddress: string | undefined, evmConnected: boolean) {
  const passRef = useRef<PumpPassResponse | null>(null);
  const inflightRef = useRef(false);

  useEffect(() => {
    if (!evmConnected || !evmAddress) {
      passRef.current = null;
      return;
    }

    if (passRef.current?.walletAddress?.toLowerCase() === evmAddress.toLowerCase()) {
      return;
    }

    if (inflightRef.current) return;
    inflightRef.current = true;

    void (async () => {
      try {
        let active = await fetchPumpPass(evmAddress);
        if (!active) {
          active = await issuePumpPass(evmAddress);
        }
        passRef.current = active;
      } catch {
        passRef.current = null;
      } finally {
        inflightRef.current = false;
      }
    })();
  }, [evmAddress, evmConnected]);

  return {
    getPassId: () => passRef.current?.passId ?? null,
  };
}
