"use client";

import { cn } from "@/lib/utils";
import { messages } from "@/i18n/messages";

type PumpPrepareBannerProps = {
  visible: boolean;
  message: string;
  className?: string;
};

export function PumpPrepareBanner({ visible, message, className }: PumpPrepareBannerProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-purple-500/35 bg-gradient-to-r from-purple-950/50 to-emerald-950/30 px-4 py-3 text-center shadow-[0_0_24px_rgba(168,85,247,0.12)]",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-semibold tracking-wide text-purple-100">{messages.nav.preparingGas}</p>
      <p className="mt-1 text-xs text-purple-200/85">{message}</p>
      <div className="mx-auto mt-2.5 h-1 w-28 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/3 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-emerald-400 via-purple-400 to-emerald-400" />
      </div>
    </div>
  );
}
