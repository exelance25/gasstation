"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/hooks/useAdminSession";
import { AdminSignIn } from "@/components/AdminSignIn";

/**
 * Gas Havuzu — sunucu oturumu (httpOnly) + cüzdan imzası; admin adresi istemcide yok.
 */
export function GasHavuzuGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { authenticated, configured, loading, isConnected } = useAdminSession();

  useEffect(() => {
    if (loading) return;
    if (!configured) return;
    if (!authenticated && !isConnected) {
      router.replace("/yakit-al");
    }
  }, [authenticated, configured, isConnected, loading, router]);

  if (loading) {
    return (
      <div className="w-full max-w-xl animate-pulse rounded-xl border border-neutral-800 bg-neutral-950 p-8 text-center text-neutral-500">
        Yükleniyor…
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="w-full max-w-xl rounded-xl border border-amber-500/50 bg-amber-950/30 p-6 text-center text-amber-100">
        <p className="font-semibold">Admin yapılandırması eksik</p>
        <p className="mt-2 text-sm">
          Testnet&apos;te operatör cüzdanı otomatik admin sayılır. Mainnet için{" "}
          <code className="text-xs">ADMIN_WALLET_ADDRESS</code> tanımlayın.
        </p>
      </div>
    );
  }

  if (!authenticated) {
    if (!isConnected) {
      return (
        <div className="w-full max-w-xl rounded-xl border border-neutral-800 bg-neutral-950 p-8 text-center text-neutral-500">
          Yönlendiriliyor — YAKIT AL…
        </div>
      );
    }
    return <AdminSignIn />;
  }

  return <>{children}</>;
}
