"use client";

import { useEffect } from "react";
import {
  AUTO_FEE_EXPLAINER,
  GASSTATION_MISSION,
  GASSTATION_VISION,
  HOW_GASSTATION_WORKS,
} from "@/config/gasstation-content";
import { GasStationLogo } from "@/components/GasStationLogo";

type AboutGasstationPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function AboutGasstationPanel({ open, onClose }: AboutGasstationPanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-end justify-center bg-black/65 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      aria-labelledby="about-gasstation-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#12151a] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:max-h-[88vh] sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <GasStationLogo className="h-9 w-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 id="about-gasstation-title" className="text-base font-bold text-white">
              Hakkımızda
            </h2>
            <p className="text-[11px] text-neutral-500">GASSTATION · Cross-chain gas istasyonu</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-neutral-400 hover:bg-white/10 hover:text-white"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-neutral-300">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              GASSTATION nedir?
            </h3>
            <p className="mt-2">
              GASSTATION, bir zincirde USDC veya native token ile ödeme yapıp başka bir zincirde{" "}
              <strong className="font-semibold text-white">native gas</strong> (ETH, MON, BASE, SOL)
              teslim almanızı sağlayan cross-chain yakıt protokolüdür. Cüzdan uygulaması, dApp,
              NFT platformu veya backend — entegrasyon yüzeyi aynıdır: oracle fiyat, sipariş, ödeme,
              dispense.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Misyon
            </h3>
            <p className="mt-2">{GASSTATION_MISSION}</p>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">Vizyon</h3>
            <p className="mt-2">{GASSTATION_VISION}</p>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400/90">
              Nasıl kullanılır?
            </h3>
            <ol className="mt-3 space-y-3">
              {HOW_GASSTATION_WORKS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Adım {i + 1}
                  </p>
                  <p className="mt-1 font-semibold text-white">{step.title}</p>
                  <p className="mt-1 text-[13px] text-neutral-400">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90">
              {AUTO_FEE_EXPLAINER.title}
            </h3>
            <p className="mt-2 text-neutral-400">{AUTO_FEE_EXPLAINER.summary}</p>
            <ul className="mt-3 space-y-2">
              {AUTO_FEE_EXPLAINER.useCases.map((uc) => (
                <li
                  key={uc.vertical}
                  className="rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2"
                >
                  <p className="text-[13px] font-semibold text-white">{uc.vertical}</p>
                  <p className="mt-0.5 text-[12px] text-neutral-500">{uc.detail}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-neutral-500">
              Geliştirici paketleri için üst menüdeki <strong className="text-neutral-400">Otomatik</strong>{" "}
              düğmesine veya SDK penceresine bakın.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
