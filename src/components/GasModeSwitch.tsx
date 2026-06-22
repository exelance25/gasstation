"use client";

import { useGasMode } from "@/hooks/useGasMode";
import { isAutoFeeEnabled } from "@/config/client-env";
import { messages } from "@/i18n/messages";
import type { GasMode } from "@/types/gas-mode";

type GasModeSwitchProps = {
  disabled?: boolean;
  onOpenSdkPackages?: () => void;
};

function ModeOption({
  active,
  label,
  onClick,
  disabled,
  title,
  highlight,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
        active
          ? "bg-emerald-500/20 text-emerald-300"
          : highlight
            ? "text-purple-300/90 hover:bg-purple-500/10 hover:text-purple-200"
            : "text-neutral-500 hover:text-neutral-300"
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border ${
          active
            ? "border-emerald-400 bg-emerald-500 text-black"
            : highlight
              ? "border-purple-500/50 bg-transparent"
              : "border-neutral-600 bg-transparent"
        }`}
        aria-hidden
      >
        {active && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor">
            <path d="M10.2 2.4 4.8 8.8 1.8 5.8l1.2-1.2 1.8 1.8 4.2-4.2 1.2 1.2z" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

export function GasModeSwitch({ disabled, onOpenSdkPackages }: GasModeSwitchProps) {
  const { mode, setMode } = useGasMode();
  const autoAvailable = isAutoFeeEnabled();

  const select = (next: GasMode) => {
    if (!disabled && next === "manual") setMode("manual");
    if (!disabled && next === "automatic" && autoAvailable) setMode("automatic");
  };

  const openSdk = () => {
    if (disabled) return;
    onOpenSdkPackages?.();
  };

  return (
    <div className="flex flex-col items-end gap-1" role="group" aria-label={messages.mode.groupLabel}>
      <div className="flex rounded-xl border border-neutral-700/80 bg-neutral-900/60 p-1">
        <ModeOption
          active={mode === "manual"}
          label={messages.mode.manual}
          disabled={disabled}
          onClick={() => select("manual")}
        />
        <ModeOption
          active={mode === "automatic" && autoAvailable}
          label={messages.mode.automatic}
          disabled={disabled}
          highlight={!autoAvailable}
          title={messages.mode.sdkTitle}
          onClick={openSdk}
        />
      </div>
      <p className="max-w-[13rem] text-right text-[9px] leading-snug text-neutral-500">
        {mode === "manual"
          ? messages.mode.manualHint
          : autoAvailable
            ? messages.mode.autoActive
            : messages.mode.autoSdk}
      </p>
    </div>
  );
}
