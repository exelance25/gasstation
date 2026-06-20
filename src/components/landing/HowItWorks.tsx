"use client";

import { HOW_IT_WORKS_STEPS } from "@/components/landing/landing-data";

export function HowItWorks() {
  return (
    <section id="nasil-kullanilir" className="border-t border-white/[0.06] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Nasıl Kullanılır</h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
            Üç adımda USDC&apos;den native gas&apos;a geç.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((s) => (
            <li
              key={s.step}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Adım {s.step}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{s.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
