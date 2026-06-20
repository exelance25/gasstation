"use client";

import { useEffect, useState } from "react";
import { sessionManager, type SecureSession } from "@/session/session-manager";

export function useSession() {
  const [session, setSession] = useState<SecureSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionManager.load().then((data) => {
      setSession(data);
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    await sessionManager.invalidateServerSession();
    setSession(null);
  };

  return { session, loading, logout };
}
