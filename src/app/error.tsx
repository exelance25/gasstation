"use client";

import Link from "next/link";
import { useEffect } from "react";
import { isWalletConnectNoise } from "@/lib/wallet-connect-errors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isWalletConnectNoise(error)) {
      reset();
      return;
    }
    if (error.message?.includes("clientReferenceManifest")) {
      console.error(
        "[GASSTATION] Next.js build önbelleği bozuk — .next silinip sunucu yeniden başlatılmalı.",
      );
      return;
    }
    console.error("[GASSTATION Error]", error.message || error.digest || "Unknown error");
  }, [error, reset]);

  if (isWalletConnectNoise(error)) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#1a0a2e] px-4">
      <div className="max-w-md rounded-xl border border-neon-red/60 bg-black/80 p-8 text-center">
        <h1 className="font-display text-xl font-bold text-neon-red">Bir hata oluştu</h1>
        <p className="mt-3 font-dotmatrix text-xs text-gray-400">
          {error.message || "Beklenmeyen hata"}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-md border border-neon-purple/60 bg-neon-purple/20 px-6 py-2 font-dotmatrix text-sm text-purple-200 hover:bg-neon-purple/30"
        >
          Tekrar Dene
        </button>
        <Link
          href="/yakit-al"
          className="mt-3 block font-dotmatrix text-xs text-cyan-400 hover:underline"
        >
          Yakıt Al sayfasına dön
        </Link>
      </div>
    </main>
  );
}
