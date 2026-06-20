"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminSession } from "@/hooks/useAdminSession";

export function useAdminFeedbackCount(): number {
  const { authenticated } = useAdminSession();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!authenticated) {
      setCount(0);
      return;
    }
    try {
      const res = await fetch("/api/admin/feedback", { credentials: "include" });
      if (!res.ok) {
        setCount(0);
        return;
      }
      const data = (await res.json()) as { messages?: unknown[] };
      setCount(Array.isArray(data.messages) ? data.messages.length : 0);
    } catch {
      setCount(0);
    }
  }, [authenticated]);

  useEffect(() => {
    void refresh();
    if (!authenticated) return;
    const poll = window.setInterval(() => void refresh(), 45_000);
    const onChanged = () => void refresh();
    window.addEventListener("admin-feedback-changed", onChanged);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("admin-feedback-changed", onChanged);
    };
  }, [authenticated, refresh]);

  return count;
}
