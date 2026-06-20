"use client";

type PumpPassBadgeProps = {
  passId: string | null | undefined;
  loading?: boolean;
  className?: string;
};

/** Müşteri giriş bileti — cüzdan bağlanınca GP-… */
export function PumpPassBadge({ passId, loading, className = "" }: PumpPassBadgeProps) {
  if (loading) {
    return (
      <p className={`text-center text-[11px] text-amber-200/60 ${className}`}>
        Biletiniz hazırlanıyor…
      </p>
    );
  }
  if (!passId) return null;

  return (
    <div
      className={`rounded-xl border border-emerald-400/20 bg-emerald-950/25 px-3 py-2.5 text-center ${className}`}
    >
      <p className="text-[10px] font-medium text-emerald-200/80">
        Senin biletin — kasa seni tanıyor
      </p>
      <p className="mt-1 font-mono text-sm font-bold tracking-wider text-emerald-300">
        {passId}
      </p>
    </div>
  );
}
