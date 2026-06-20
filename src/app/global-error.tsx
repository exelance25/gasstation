"use client";

import { useEffect } from "react";
import { isWalletConnectNoise } from "@/lib/wallet-connect-errors";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isWalletConnectNoise(error)) {
      reset();
    }
  }, [error, reset]);

  if (isWalletConnectNoise(error)) {
    return null;
  }

  return (
    <html lang="tr">
      <body style={{ margin: 0, background: "#1a0a2e", color: "#fff" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <h1 style={{ color: "#ff3366" }}>Kritik Hata</h1>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "12px" }}>
              {error.message}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                marginTop: "24px",
                padding: "10px 24px",
                background: "#6d28d9",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Yeniden Yükle
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
