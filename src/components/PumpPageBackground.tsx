"use client";

import { GasStationLogo } from "@/components/GasStationLogo";

/**
 * A + B: istasyon hissi — daha aydınlık taban, belirgin neon wash, silik logo.
 * Karanlık siyah yerine lacivert-gri gradient; UI okunurluğu korunur.
 */
export function PumpPageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Taban — düz siyah değil, derinlikli gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(168deg, #222a3a 0%, #1a2230 28%, #1e2840 52%, #171d2a 78%, #141820 100%)",
        }}
      />

      {/* İnce grid — düz karanlığı kırar */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 85% 75% at 50% 45%, black 20%, transparent 72%)",
        }}
      />

      {/* Neon wash + merkez spot (pompa tavan ışığı) */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 65% at 14% 6%, rgba(16,185,129,0.22), transparent 58%),
            radial-gradient(ellipse 85% 60% at 88% 92%, rgba(138,43,226,0.2), transparent 55%),
            radial-gradient(ellipse 55% 45% at 50% 38%, rgba(120,160,255,0.08), transparent 62%),
            radial-gradient(ellipse 70% 50% at 50% 100%, rgba(16,185,129,0.06), transparent 50%)
          `,
        }}
      />

      {/* Ambient blob — daha görünür */}
      <div className="pump-ambient-blob pump-ambient-blob-emerald absolute -left-[16%] top-[4%] h-[min(56vmax,560px)] w-[min(56vmax,560px)] rounded-full bg-emerald-400/[0.14] blur-[80px]" />
      <div className="pump-ambient-blob pump-ambient-blob-purple absolute -right-[12%] bottom-0 h-[min(52vmax,520px)] w-[min(52vmax,520px)] rounded-full bg-purple-500/[0.13] blur-[80px]" />
      <div className="pump-ambient-blob pump-ambient-blob-emerald absolute left-[30%] top-[55%] h-[min(32vmax,320px)] w-[min(32vmax,320px)] rounded-full bg-teal-400/[0.07] blur-[64px] opacity-80" />

      {/* Watermark logo — artık fark edilir ama formu engellemez */}
      <div
        className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 sm:top-[48%]"
        style={{
          opacity: 0.1,
          filter: "drop-shadow(0 0 48px rgba(16,185,129,0.25)) drop-shadow(0 0 80px rgba(138,43,226,0.15))",
        }}
      >
        <GasStationLogo className="h-[min(62vw,480px)] w-[min(62vw,480px)]" />
      </div>

      {/* Kenar vignette — hafif; ortayı aydınlık tutar */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 95% 88% at 50% 42%, transparent 55%, rgba(8,10,16,0.45) 100%)",
        }}
      />
    </div>
  );
}
