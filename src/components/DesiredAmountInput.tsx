"use client";

import type { PackageQuote } from "@/lib/pricing";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import {
  computeConservativeDeliveryAmount,
  formatGasDeliveryAmount,
  formatPackageUsd,
} from "@/lib/pricing";
import { ORACLE_CONSERVATIVE_BUFFER } from "@/lib/oracle/live-prices";

type DesiredAmountInputProps = {
  value: string;
  onChange: (value: string) => void;
  deliveryAsset: GasDeliveryAsset;
  quote: PackageQuote | null;
  disabled?: boolean;
  balanceWarning?: string | null;
  invalidHint?: string | null;
};

export function DesiredAmountInput({
  value,
  onChange,
  deliveryAsset,
  quote,
  disabled,
  balanceWarning,
  invalidHint,
}: DesiredAmountInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Almak istediğiniz miktar
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.2)] focus-within:border-emerald-500/40">
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="ör. 0.0001"
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value.replace(",", "."))}
            className="min-w-0 flex-1 bg-transparent text-lg font-bold tabular-nums text-white outline-none placeholder:text-neutral-600 disabled:opacity-50"
            aria-label={`Almak istediğiniz ${deliveryAsset} miktarı`}
          />
          <span className="shrink-0 text-sm font-bold text-emerald-400/90">{deliveryAsset}</span>
        </div>
        {invalidHint ? (
          <p className="text-[11px] font-medium text-amber-400/95">{invalidHint}</p>
        ) : (
          <div className="space-y-0.5">
            <p className="text-[10px] text-neutral-600">
              Canlı fiyat + %{(ORACLE_CONSERVATIVE_BUFFER * 100).toFixed(0)} arbitraj buffer — 5 sn'de
              yenilenir
            </p>
            {quote ? (
              <p className="text-[10px] text-neutral-500">
                Tahmini alacağınız gas miktarı:{" "}
                <span className="font-semibold tabular-nums text-emerald-400/90">
                  ~
                  {formatGasDeliveryAmount(
                    computeConservativeDeliveryAmount(quote),
                    deliveryAsset,
                  )}{" "}
                  {deliveryAsset}
                </span>
              </p>
            ) : null}
          </div>
        )}
        {balanceWarning ? (
          <p className="text-[11px] font-medium text-amber-400/95">{balanceWarning}</p>
        ) : null}
      </div>

      <div className="rounded-2xl bg-emerald-950/15 p-4 shadow-[0_8px_28px_rgba(0,0,0,0.3)]">
        <p className="text-xs text-neutral-400">
          Tahmini ödeme
          {quote ? <span className="ml-1 text-emerald-500/80">· canlı</span> : null}
        </p>
        {quote ? (
          <>
            <p className="mt-1 text-2xl font-bold tabular-nums text-white">
              {formatPackageUsd(quote.packageUsd)}{" "}
              <span className="text-base font-normal text-neutral-400">tahsil</span>
            </p>
            <p className="mt-2 text-[10px] text-neutral-500">
              ~
              {formatGasDeliveryAmount(
                computeConservativeDeliveryAmount(quote),
                quote.deliveryAsset,
              )}{" "}
              {quote.deliveryAsset} teslim · Net gas ${quote.netUsdForGas.toFixed(2)}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">Geçerli bir miktar girin…</p>
        )}
      </div>
    </div>
  );
}
