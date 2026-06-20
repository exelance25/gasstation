"use client";

import { useState } from "react";
import { APP_STATS, HOW_TO_USE_STEPS } from "@/lib/app-stats";
import { formatStat, useAnimatedCounter } from "@/components/landing/use-animated-counter";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] sm:text-xs">
      <span className="text-neutral-500">{label}</span>
      <span className="font-semibold tabular-nums text-emerald-300">{value}</span>
    </span>
  );
}

export function PumpTopBar() {
  const [howOpen, setHowOpen] = useState(false);
  const [sdkOpen, setSdkOpen] = useState(false);

  const users = useAnimatedCounter(APP_STATS.totalUsers, 2000, true);
  const volume = useAnimatedCounter(APP_STATS.totalVolumeUsd, 2400, true);

  const tabClass = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition sm:px-4 sm:text-xs",
      active
        ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/40"
        : "text-neutral-400 hover:bg-white/[0.06] hover:text-white",
    );

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-charcoal/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-indigo-600 text-[10px] font-bold text-white">
              P
            </span>
            <span className="text-xs font-bold tracking-[0.18em] text-white sm:text-sm">
              GASSTATION
            </span>
          </div>

          <nav
            className="flex flex-wrap items-center gap-2 sm:justify-center"
            aria-label="Bilgi sekmeleri"
          >
            <button type="button" className={tabClass(howOpen)} onClick={() => setHowOpen(true)}>
              Nasıl Kullanılır
            </button>
            <button type="button" className={tabClass(sdkOpen)} onClick={() => setSdkOpen(true)}>
              Otomatik Gas SDK
            </button>
          </nav>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <StatPill label="Kullanıcı" value={formatStat(users)} />
            <StatPill label="Hacim" value={formatStat(volume, "$")} />
          </div>
        </div>
      </header>

      <Dialog open={howOpen} onOpenChange={setHowOpen} title="Nasıl Kullanılır">
        <ol className="space-y-4 text-sm text-neutral-300">
          {HOW_TO_USE_STEPS.map((s) => (
            <li key={s.step} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Adım {s.step}
              </p>
              <p className="mt-1 font-semibold text-white">{s.title}</p>
              <p className="mt-1 text-neutral-400">{s.text}</p>
            </li>
          ))}
        </ol>
      </Dialog>

      <Dialog open={sdkOpen} onOpenChange={setSdkOpen} title="Otomatik Gas SDK">
        <div className="space-y-3 text-sm text-neutral-300">
          <p>
            <code className="text-emerald-300">@pumpstation/sdk</code> — Base üzerinde USDC ödeme,
            hedef ağda otomatik gas teslimi.
          </p>
          <p className="text-neutral-400">
            Otomatik modda kullanıcı Base ETH tutmadan işlem yapabilir; gas sponsor devreye girer,
            ücret işlem sonrası tahsil edilir.
          </p>
          <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] text-neutral-400">
            {`npm install @pumpstation/sdk viem

import { PumpClient } from "@pumpstation/sdk";`}
          </pre>
          <p className="text-xs text-neutral-500">
            Detay: proje içi <code>sdk/README.md</code>
          </p>
        </div>
      </Dialog>
    </>
  );
}
