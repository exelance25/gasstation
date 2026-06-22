"use client";

import type { DepotAssetId } from "@/config/depot-assets";
import {
  deliveryTargetHint,
  isTargetFormatMismatch,
  isValidDeliveryTarget,
  TARGET_FORMAT_ERROR,
} from "@/lib/delivery-target";
import { messages } from "@/i18n/messages";
import { cn } from "@/lib/utils";

type TargetAddressInputProps = {
  value: string;
  onChange: (value: string) => void;
  deliveryAsset: DepotAssetId;
  disabled?: boolean;
  ownWalletAddress?: string;
};

export function TargetAddressInput({
  value,
  onChange,
  deliveryAsset,
  disabled,
  ownWalletAddress,
}: TargetAddressInputProps) {
  const trimmed = value.trim();
  const isValid = isValidDeliveryTarget(deliveryAsset, value);
  const hasMismatch = isTargetFormatMismatch(deliveryAsset, value);
  const showSuccess = trimmed.length > 0 && isValid;

  const canUseOwn =
    ownWalletAddress &&
    deliveryAsset !== "SOL" &&
    ownWalletAddress.toLowerCase() !== trimmed.toLowerCase();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-amber-100/90">{messages.target.title}</p>
          <p className="mt-0.5 text-[11px] text-neutral-400">{messages.target.hint}</p>
        </div>
        {canUseOwn && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(ownWalletAddress)}
            className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-emerald-300/90 hover:bg-white/[0.08] disabled:opacity-50"
          >
            {messages.target.useOwn}
          </button>
        )}
      </div>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={messages.target.placeholder}
        autoComplete="off"
        spellCheck={false}
        aria-invalid={hasMismatch}
        className={cn(
          "w-full rounded-2xl border-2 bg-white/[0.04] px-4 py-3 font-mono text-sm text-white placeholder:text-neutral-600 focus:bg-white/[0.06] focus:outline-none",
          hasMismatch
            ? "border-red-500 ring-2 ring-red-500/30"
            : "border-transparent focus:ring-1 focus:ring-emerald-500/40",
        )}
      />
      {hasMismatch && <p className="text-xs text-red-400">{TARGET_FORMAT_ERROR}</p>}
      {showSuccess && (
        <p className="text-xs text-emerald-400">
          {messages.target.valid} · {trimmed.slice(0, 6)}…{trimmed.slice(-4)}
        </p>
      )}
      {trimmed.length > 0 && !isValid && !hasMismatch && (
        <p className="text-xs text-amber-400">{deliveryTargetHint(deliveryAsset)}</p>
      )}
    </div>
  );
}
