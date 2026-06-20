"use client";

import { useEffect, useState } from "react";
import { fetchRelayerStatus } from "@/lib/relay-client";

export function useRelayerStatus() {
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchRelayerStatus()
      .then((s) => {
        if (!cancelled) setEnabled(s.enabled);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { relayerEnabled: enabled, checkingRelayer: checking };
}
