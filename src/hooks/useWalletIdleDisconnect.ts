"use client";

import { useEffect, useRef } from "react";

import {
  clearWalletActiveSession,
  touchWalletActiveSession,
  WALLET_IDLE_MS,
} from "@/lib/wallet-session";

/**
 * Bağlı cüzdan — 5 dk kullanıcı etkileşimi yoksa disconnect.
 */
export function useWalletIdleDisconnect(
  isActive: boolean,
  onIdle: () => void | Promise<void>,
): void {
  const lastActivityRef = useRef(Date.now());
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (isActive) {
      lastActivityRef.current = Date.now();
      touchWalletActiveSession();
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const touch = () => {
      lastActivityRef.current = Date.now();
      touchWalletActiveSession();
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"] as const;
    for (const event of events) {
      window.addEventListener(event, touch, { passive: true });
    }

    const timer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= WALLET_IDLE_MS) {
        clearWalletActiveSession();
        void onIdleRef.current();
      }
    }, 30_000);

    return () => {
      for (const event of events) {
        window.removeEventListener(event, touch);
      }
      window.clearInterval(timer);
    };
  }, [isActive]);
}
