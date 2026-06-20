"use client";

interface LockedRateBadgeProps {
  isLocked: boolean;
  secondsRemaining: number;
  lockedRate: number | null;
  liveRate: number;
  isFetching?: boolean;
}

/**
 * Oracle fiyat kilidi göstergesi — transfer onayında 10 sn Locked Rate.
 */
export function LockedRateBadge({
  isLocked,
  secondsRemaining,
  lockedRate,
  liveRate,
  isFetching,
}: LockedRateBadgeProps) {
  if (isLocked && lockedRate !== null) {
    return (
      <div
        className="flex items-center gap-2 rounded-full border border-neon-accent-green/60 bg-neon-accent-green/10 px-3 py-1"
        role="status"
        aria-live="polite"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-accent-green opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-accent-green" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neon-accent-green">
          Locked Rate · ${lockedRate.toFixed(4)}/MON · {secondsRemaining}s
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[10px] text-gray-500">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${isFetching ? "animate-pulse bg-neon-accent-purple" : "bg-gray-600"}`}
      />
      Canlı oracle: ${liveRate.toFixed(4)}/MON · 10s güncelleme
    </div>
  );
}
