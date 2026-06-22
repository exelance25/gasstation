"use client";

import { messages } from "@/i18n/messages";

type PumpPassBadgeProps = {
  passId: string | null | undefined;
  loading?: boolean;
  className?: string;
};

export function PumpPassBadge({ passId, loading, className = "" }: PumpPassBadgeProps) {
  if (loading) {
    return (
      <p className={`text-center text-[11px] text-amber-200/60 ${className}`}>
        {messages.nav.passLoading}
      </p>
    );
  }
  if (!passId) return null;

  return (
    <div
      className={`rounded-xl border border-emerald-400/20 bg-emerald-950/25 px-3 py-2.5 text-center ${className}`}
    >
      <p className="text-[10px] font-medium text-emerald-200/80">{messages.nav.passReady}</p>
      <p className="mt-1 font-mono text-sm font-bold tracking-wider text-emerald-300">
        {passId}
      </p>
    </div>
  );
}
