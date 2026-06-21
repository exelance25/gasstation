"use client";

import type { PumpButtonBlockReason, PumpFlowStatus } from "@/hooks/useGasPump";
import { getDeliveryExplorerUrl } from "@/lib/explorer-urls";
import { messages } from "@/i18n/messages";
import { cn } from "@/lib/utils";

type PumpActionStatusProps = {
  blockReason: PumpButtonBlockReason;
  blockDetail?: string | null;
  flow: PumpFlowStatus;
  busy: boolean;
  onDismissResult?: () => void;
};

/** Idle ipuçları — dolum/başarı/hata PumpFlowOverlay ile ekran ortasında */
export function PumpActionStatus({
  blockReason,
  blockDetail,
  flow,
  busy,
  onDismissResult,
}: PumpActionStatusProps) {
  if (flow.phase === "success" || flow.phase === "error") {
    const isSuccess = flow.phase === "success";
    const styles = isSuccess
      ? "border-emerald-500/25 bg-emerald-950/35 text-emerald-50"
      : "border-red-500/25 bg-red-950/30 text-red-50";

    const explorerUrl =
      isSuccess && flow.deliveryTxHash && flow.deliveryAsset
        ? getDeliveryExplorerUrl(flow.deliveryAsset, flow.deliveryTxHash)
        : null;

    return (
      <div
        className={cn(
          "relative z-[60] rounded-2xl border px-4 py-3.5 text-center backdrop-blur-sm",
          styles,
        )}
        role="status"
        aria-live="polite"
      >
        <p className="text-[13px] font-medium">{flow.title}</p>
        {flow.detail ? (
          <p className="mt-1 text-[11px] leading-relaxed text-white/70">{flow.detail}</p>
        ) : null}
        {explorerUrl ? (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[10px] font-medium text-emerald-300/90 underline underline-offset-2 hover:text-emerald-200"
          >
            View on explorer
          </a>
        ) : null}
        {onDismissResult ? (
          <button
            type="button"
            onClick={onDismissResult}
            className={cn(
              "mt-3 rounded-full px-4 py-1.5 text-[11px] font-medium transition-colors",
              isSuccess
                ? "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                : "bg-red-500/15 text-red-200 hover:bg-red-500/25",
            )}
          >
            {isSuccess ? messages.common.ok : messages.common.close}
          </button>
        ) : null}
      </div>
    );
  }

  if (busy || flow.phase === "fueling") return null;

  /* No preemptive block banners — user sees feedback only after FIRE or on failure */
  return null;
}
