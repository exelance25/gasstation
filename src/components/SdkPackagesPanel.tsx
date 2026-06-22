"use client";

import { useEffect } from "react";
import {
  AUTO_FEE_ARCHITECTURE,
  GITHUB_LINKS,
  SDK_PACKAGES,
} from "@/config/gasstation-content";
import { GasStationLogo } from "@/components/GasStationLogo";
import { messages } from "@/i18n/messages";

type SdkPackagesPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function SdkPackagesPanel({ open, onClose }: SdkPackagesPanelProps) {
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
      className="fixed inset-0 z-[400] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      aria-labelledby="sdk-packages-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-emerald-500/20 bg-[#0f1218] shadow-[0_0_48px_rgba(16,185,129,0.12)] sm:max-h-[90vh] sm:rounded-3xl">
        <div className="flex items-start gap-3 border-b border-white/[0.06] px-5 py-4">
          <GasStationLogo className="mt-0.5 h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 id="sdk-packages-title" className="text-lg font-bold text-white">
              {messages.sdk.title}
            </h2>
            <p className="mt-1 text-[12px] leading-snug text-neutral-400">{messages.sdk.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full px-2 py-1 text-sm text-neutral-400 hover:bg-white/10 hover:text-white"
            aria-label={messages.common.close}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <p className="rounded-xl border border-emerald-500/15 bg-emerald-950/20 px-4 py-3 text-[13px] text-neutral-300">
            {messages.sdk.autoModeNote}
          </p>

          <section className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4">
            <h3 className="text-sm font-bold text-cyan-300">{AUTO_FEE_ARCHITECTURE.title}</h3>
            <ol className="mt-3 space-y-3">
              {AUTO_FEE_ARCHITECTURE.layers.map((layer, i) => (
                <li key={layer.name} className="text-[12px] text-neutral-400">
                  <span className="font-semibold text-white">
                    {i + 1}. {layer.name}
                  </span>
                  <p className="mt-0.5">{layer.detail}</p>
                </li>
              ))}
            </ol>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-white/[0.06] bg-black/40 p-3 text-[10px] text-emerald-300/90">
              {`{
  "gasNeeded": "0.00013 ETH",
  "cost": "0.42 USDC",
  "fee": "0.05 USDC"
}`}
            </pre>
          </section>

          {SDK_PACKAGES.map((pkg) => (
            <article
              key={pkg.id}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <code className="text-sm font-bold text-emerald-300">{pkg.npmName}</code>
                  <p className="mt-1 text-[13px] text-neutral-400">{pkg.tagline}</p>
                </div>
                <span className="rounded-full border border-purple-500/25 bg-purple-950/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-300">
                  {pkg.audience}
                </span>
              </div>

              <ul className="mt-3 space-y-1">
                {pkg.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[12px] text-neutral-400">
                    <span className="text-emerald-500/80" aria-hidden>
                      ·
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <pre className="mt-3 overflow-x-auto rounded-lg border border-white/[0.06] bg-black/40 p-3 text-[10px] leading-relaxed text-neutral-400">
                {pkg.install}
                {"\n\n"}
                {pkg.exampleSnippet}
              </pre>

              <a
                href={GITHUB_LINKS[pkg.githubPath]}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-300 hover:text-indigo-200"
              >
                GitHub →{" "}
                {pkg.githubPath === "integrators"
                  ? messages.sdk.githubIntegrators
                  : messages.sdk.githubSource}
                <span aria-hidden>↗</span>
              </a>
            </article>
          ))}

          <p className="pb-2 text-center text-[11px] text-neutral-600">
            {messages.sdk.mainRepo}:{" "}
            <a
              href={GITHUB_LINKS.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 underline hover:text-neutral-400"
            >
              {GITHUB_LINKS.repo.replace("https://github.com/", "")}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
