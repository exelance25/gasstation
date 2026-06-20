"use client";

import { useEffect, useState } from "react";
import { PROTOCOL_STATS } from "@/components/landing/landing-data";
import { formatStat, useAnimatedCounter } from "@/components/landing/use-animated-counter";

export function ProtocolBar() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLive(true), 300);
    return () => clearTimeout(t);
  }, []);

  const users = useAnimatedCounter(PROTOCOL_STATS.totalUsers, 2000, live);

  return (
    <div
      className="relative z-50 flex h-9 items-center border-b border-white/[0.06] bg-[#05060a]/90 backdrop-blur-md"
      role="status"
      aria-label="Toplam kullanıcı sayısı"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4">
        <p className="text-xs font-medium tracking-wide text-zinc-400 sm:text-sm">
          <span className="text-zinc-500">Toplam Kullanıcı:</span>{" "}
          <span className="tabular-nums font-semibold text-white">{formatStat(users)}</span>
        </p>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
    </div>
  );
}
