"use client";

import { Check, X } from "lucide-react";
import { GlassCta } from "@/components/landing/LandingNav";

const PROBLEMS = [
  "Swap yapamıyorsun",
  "Bridge kuramıyorsun",
  "Ödül claim edemiyorsun",
  "Stake edemiyorsun",
  "Varlığını taşıyamıyorsun",
] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent)]" />

      <div className="relative mx-auto max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">
          GASSTATION
        </p>
        <h1 className="text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
          ELİNDE USDC VAR,
          <br />
          <span className="bg-gradient-to-r from-indigo-300 via-white to-cyan-300 bg-clip-text text-transparent">
            AMA GAS YOK MU?
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
          GASSTATION, stablecoin&apos;ini saniyeler içinde ihtiyacın olan native gas&apos;a çevirir.
          Köprü yok, borsa yok, zincir atlama yok — sadece pompa, sadece yakıt.
        </p>

        <div className="mt-7 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-200/90">
            Web3&apos;ün gas sorunu
          </p>
          <ul className="mt-3 space-y-2">
            {PROBLEMS.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-zinc-300">
                <X className="h-4 w-4 shrink-0 text-red-400/80" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-sm font-medium text-emerald-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Tek sebep: doğru gas token&apos;ın yok. GASSTATION bunu çözer.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <GlassCta href="/yakit-al">Yakıt Al</GlassCta>
          <GlassCta href="#nasil-kullanilir" variant="secondary">
            Nasıl Kullanılır
          </GlassCta>
        </div>
      </div>
    </section>
  );
}
