"use client";

import { useEffect } from "react";
import { isWalletConnectNoise } from "@/lib/wallet-connect-errors";

/** WC websocket kopması — Next.js kırmızı ekranını engelle */
export function useWalletConnectErrorGuard() {
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isWalletConnectNoise(event.reason)) {
        event.preventDefault();
      }
    };

    const onError = (event: ErrorEvent) => {
      if (isWalletConnectNoise(event.error ?? event.message)) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);
    return () => {
      window.removeEventListener("unhandledrejection", onRejection);
      window.removeEventListener("error", onError);
    };
  }, []);
}
