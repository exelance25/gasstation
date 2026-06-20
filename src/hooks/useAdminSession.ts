"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

type AdminStatus = {
  authenticated: boolean;
  configured: boolean;
};

export function useAdminSession() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState<AdminStatus>({
    authenticated: false,
    configured: true,
  });
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/status", { credentials: "include" });
    const data = (await res.json()) as AdminStatus;
    setStatus(data);
    setLoading(false);
    return data;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Önce cüzdanınızı bağlayın.");
      return false;
    }

    setSigningIn(true);
    setError(null);
    try {
      const challengeRes = await fetch("/api/admin/challenge", {
        credentials: "include",
      });
      if (!challengeRes.ok) {
        throw new Error("Doğrulama başlatılamadı.");
      }
      const { message } = (await challengeRes.json()) as { message: string };
      const signature = await signMessageAsync({ message });

      const verifyRes = await fetch("/api/admin/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message, signature }),
      });

      if (!verifyRes.ok) {
        throw new Error("Yetkisiz cüzdan veya geçersiz imza.");
      }

      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Giriş başarısız.");
      return false;
    } finally {
      setSigningIn(false);
    }
  }, [address, isConnected, refresh, signMessageAsync]);

  const signOut = useCallback(async () => {
    await fetch("/api/admin/session", { method: "DELETE", credentials: "include" });
    await refresh();
  }, [refresh]);

  return {
    authenticated: status.authenticated,
    configured: status.configured,
    loading,
    signingIn,
    error,
    signIn,
    signOut,
    refresh,
    isConnected,
    address,
  };
}
