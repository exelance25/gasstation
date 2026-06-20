"use client";

import type { PumpButtonBlockReason, PumpFlowStatus } from "@/hooks/useGasPump";
import { getPumpBlockMessage, getPumpBlockTitle } from "@/lib/pump-block-messages";
import { getDeliveryExplorerUrl } from "@/lib/explorer-urls";
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
            Teslimat → explorer
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
            {isSuccess ? "Tamam" : "Kapat"}
          </button>
        ) : null}
      </div>
    );
  }

  if (busy || flow.phase === "fueling") return null;

  const title = getPumpBlockTitle(blockReason);
  const message = getPumpBlockMessage(blockReason, blockDetail);
  if (!title || !message) return null;

  const isWarn =
    blockReason === "tank_empty" ||
    blockReason === "below_minimum" ||
    blockReason === "insufficient_usdc" ||
    blockReason === "insufficient_native" ||
    blockReason === "collector" ||
    blockReason === "treasury_native" ||
    blockReason === "insufficient_usdc_paymaster";

  return (
    <div
      className={cn(
        "rounded-2xl border px-3.5 py-2.5 text-center backdrop-blur-[2px]",
        isWarn
          ? "border-amber-500/20 bg-amber-950/15 text-amber-100/90"
          : "border-white/[0.06] bg-white/[0.02] text-neutral-400",
      )}
      role="status"
    >
      <p className="text-[10px] font-medium tracking-wide text-neutral-500">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">{message}</p>
      {blockReason === "tank_empty" && (
        <p className="mt-1.5 text-[10px] leading-snug text-neutral-500">
          Geçici kasa limiti — daha küçük miktar deneyin.
        </p>
      )}
    </div>
  );
}
