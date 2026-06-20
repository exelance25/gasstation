"use client";

import { useEffect, useState } from "react";
import { isMainnetClientEnv } from "@/lib/app-env";

type Stats = {
  uniqueUsers: number;
  completedTransactions: number;
};

export function PumpUserCounter() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!isMainnetClientEnv()) return;

    let cancelled = false;
    const load = () => {
      void fetch("/api/stats/public", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!cancelled && data) {
            setStats({
              uniqueUsers: Number(data.uniqueUsers) || 0,
              completedTransactions: Number(data.completedTransactions) || 0,
            });
          }
        })
        .catch(() => {
          /* ignore */
        });
    };

    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  if (!isMainnetClientEnv() || !stats) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full border border-emerald-500/25 bg-emerald-950/30 px-4 py-1.5 text-center text-[11px] text-emerald-100/90 shadow-[0_0_20px_rgba(16,185,129,0.12)]"
      role="status"
      aria-label="Platform istatistikleri"
    >
      <span>
        <span className="font-bold tabular-nums text-emerald-300">{stats.uniqueUsers}</span>{" "}
        kullanıcı
      </span>
      <span className="hidden text-emerald-600/80 sm:inline" aria-hidden>
        ·
      </span>
      <span>
        <span className="font-bold tabular-nums text-emerald-300">
          {stats.completedTransactions}
        </span>{" "}
        tamamlanan işlem
      </span>
    </div>
  );
}
