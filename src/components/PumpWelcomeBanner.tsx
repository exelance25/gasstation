"use client";

type PumpWelcomeBannerProps = {
  connected: boolean;
};

export function PumpWelcomeBanner({ connected }: PumpWelcomeBannerProps) {
  if (connected) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/35 to-neutral-950/40 px-3 py-2 text-center sm:rounded-2xl sm:px-4 sm:py-2.5">
        <p className="text-[13px] font-medium text-emerald-100/95 sm:text-sm">
          Hazırsın — istasyon açık
        </p>
        <p className="mt-0.5 text-[10px] leading-snug text-neutral-500 sm:text-[11px]">
          Ödeme · miktar · hedef ·{" "}
          <span className="font-medium text-amber-200/90">ATEŞLE</span>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xs rounded-xl border border-amber-400/15 bg-gradient-to-br from-amber-950/20 via-neutral-950/45 to-emerald-950/15 px-3 py-2.5 text-center shadow-[0_4px_24px_rgba(251,191,36,0.05)] sm:max-w-sm sm:rounded-2xl sm:px-4 sm:py-3">
      <p className="text-[13px] font-semibold tracking-tight text-amber-50/95 sm:text-sm">
        Cüzdanını bağla
      </p>
      <p className="mt-1 text-[10px] leading-snug text-neutral-500 sm:text-[11px] sm:leading-relaxed">
        USDC · ETH · BASE · MON ile öde,
        <br className="sm:hidden" />
        {" "}
        hedefe gas al — saniyeler içinde.
      </p>
    </div>
  );
}
