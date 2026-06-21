"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "@/hooks/useAdminSession";
import { AdminSignIn } from "@/components/AdminSignIn";
import { messages } from "@/i18n/messages";

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
        {messages.admin.guardLoading}
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="w-full max-w-xl rounded-xl border border-amber-500/50 bg-amber-950/30 p-6 text-center text-amber-100">
        <p className="font-semibold">{messages.admin.guardMisconfigured}</p>
        <p className="mt-2 text-sm">{messages.admin.guardMisconfiguredDetail}</p>
      </div>
    );
  }

  if (!authenticated) {
    if (!isConnected) {
      return (
        <div className="w-full max-w-xl rounded-xl border border-neutral-800 bg-neutral-950 p-8 text-center text-neutral-500">
          {messages.admin.guardRedirect}
        </div>
      );
    }
    return <AdminSignIn />;
  }

  return <>{children}</>;
}
