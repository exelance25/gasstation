"use client";

import { useEffect, useState } from "react";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import { getDepotAsset } from "@/config/depot-assets";
import type { PumpFlowStatus } from "@/hooks/useGasPump";
import { getDeliveryExplorerUrl } from "@/lib/explorer-urls";
import { messages } from "@/i18n/messages";
import { cn } from "@/lib/utils";

type PumpFlowOverlayProps = {
  flow: PumpFlowStatus;
  deliveryAsset: GasDeliveryAsset;
  onDismiss?: () => void;
};

export function PumpFlowOverlay({ flow, deliveryAsset, onDismiss }: PumpFlowOverlayProps) {
  const asset = getDepotAsset(deliveryAsset);
  const [remaining, setRemaining] = useState(flow.fuelEstimateSec ?? 0);

  const visible =
    flow.phase === "fueling" || flow.phase === "success" || flow.phase === "error";

  useEffect(() => {
    if (flow.phase !== "fueling" || !flow.fuelEstimateSec || !flow.fuelStartedAt) return;
    const tick = () => {
      const elapsed = (Date.now() - flow.fuelStartedAt!) / 1000;
      setRemaining(Math.max(0, Math.ceil(flow.fuelEstimateSec! - elapsed)));
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [flow.phase, flow.fuelEstimateSec, flow.fuelStartedAt]);

  if (!visible) return null;

  const isFueling = flow.phase === "fueling";
  const isSuccess = flow.phase === "success";
  const isError = flow.phase === "error";

  const explorerUrl =
    isSuccess && flow.deliveryTxHash && flow.deliveryAsset
      ? getDeliveryExplorerUrl(flow.deliveryAsset, flow.deliveryTxHash)
      : null;

  const errorTitle = flow.title || messages.pump.failedTitle;
  const errorDetail = flow.detail || messages.errors.unknown;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-busy={isFueling}
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[3px]" aria-hidden />

      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "absolute h-52 w-52 rounded-full blur-3xl sm:h-60 sm:w-60",
            isSuccess && "animate-pulse bg-emerald-500/30",
            isError && "bg-red-500/25",
            isFueling && "animate-pulse",
          )}
          style={
            isFueling
              ? {
                  background: `radial-gradient(circle, ${asset.colorFrom}55, ${asset.colorTo}22, transparent 70%)`,
                }
              : undefined
          }
          aria-hidden
        />

        <div className="relative h-48 w-48 sm:h-56 sm:w-56">
          {isFueling && (
            <>
              <div
                className="absolute inset-0 animate-spin rounded-full opacity-90 [animation-duration:2.4s]"
                style={{
                  background: `conic-gradient(from 0deg, ${asset.colorFrom}, ${asset.colorTo}, transparent 28%, transparent 72%, ${asset.colorFrom})`,
                  mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
                  WebkitMask:
                    "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
                }}
                aria-hidden
              />
            </>
          )}

          {isSuccess && (
            <div
              className="absolute inset-0 animate-pulse rounded-full"
              style={{
                background: `conic-gradient(from 0deg, #34d399, #10b981, #6ee7b7, #10b981)`,
                mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
                WebkitMask:
                  "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
              }}
              aria-hidden
            />
          )}

          {isError && (
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "conic-gradient(from 0deg, #f87171, #ef4444, #fca5a5, #ef4444)",
                mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
                WebkitMask:
                  "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
              }}
              aria-hidden
            />
          )}

          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full border border-white/15 bg-black/25 px-3 text-center shadow-[inset_0_0_40px_rgba(255,255,255,0.06)] backdrop-blur-md sm:inset-6">
            {isFueling && (
              <>
                <span
                  className="bg-gradient-to-br bg-clip-text text-4xl font-bold tabular-nums text-transparent sm:text-5xl"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${asset.colorFrom}, ${asset.colorTo})`,
                  }}
                >
                  {remaining}
                </span>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/50">
                  sec
                </span>
                <p className="mt-2 text-[11px] font-medium leading-tight text-white/90 sm:text-xs">
                  {messages.pump.fueling}
                </p>
                {flow.fuelHint ? (
                  <p className="mt-1 line-clamp-2 text-[9px] leading-snug text-white/45 sm:text-[10px]">
                    {flow.fuelHint}
                  </p>
                ) : null}
              </>
            )}

            {isSuccess && (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
                <p className="mt-2 text-xs font-bold text-emerald-200 sm:text-sm">Complete</p>
                <p className="mt-1 line-clamp-3 text-[9px] leading-snug text-emerald-100/70 sm:text-[10px]">
                  {flow.detail ?? flow.title}
                </p>
                {explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 text-[9px] text-emerald-300/90 underline underline-offset-2"
                  >
                    {messages.common.explorer}
                  </a>
                ) : null}
              </>
            )}

            {isError && (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-300">
                  <span className="text-lg font-bold">!</span>
                </div>
                <p className="mt-2 text-xs font-bold text-red-200">{errorTitle}</p>
                <p className="mt-1 line-clamp-4 text-[9px] leading-snug text-red-100/75 sm:text-[10px]">
                  {errorDetail}
                </p>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-white/40">
          {isFueling && "Please wait — do not close this window"}
          {isSuccess && "Gas is on the way · confirmation may take a few seconds"}
        </p>

        {(isSuccess || isError) && onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              "mt-3 rounded-full px-5 py-2 text-xs font-semibold backdrop-blur-md transition hover:scale-[1.02]",
              isSuccess
                ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                : "border border-red-400/40 bg-red-500/15 text-red-100",
            )}
          >
            {isSuccess ? messages.common.ok : messages.common.close}
          </button>
        ) : null}
      </div>
    </div>
  );
}
