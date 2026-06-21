"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { messages } from "@/i18n/messages";

type AdminStatus = {
  authenticated: boolean;
  configured: boolean;
  adminWallet?: string;
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
      setError(messages.admin.connectFirst);
      return false;
    }

    setSigningIn(true);
    setError(null);
    try {
      const challengeRes = await fetch("/api/admin/challenge", {
        credentials: "include",
      });
      if (!challengeRes.ok) {
        throw new Error(messages.admin.challengeFailed);
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
        throw new Error(messages.admin.unauthorized);
      }

      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.admin.signInFailed);
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
    adminWallet: status.adminWallet,
    address,
  };
}
