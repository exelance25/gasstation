"use client";

import { formatPackageUsd } from "@/lib/pricing";
import type { FeeQuote } from "@gasstation/fee-sdk";
import { formatNativePaymentDisplay } from "@/lib/auto-fee/execute-automatic-fee";
import { autoFeePathLabel, type AutoFeePath } from "@/lib/auto-fee/path-resolver";
import type { AmountOption } from "@/lib/pricing";

type AutoFeeQuotePanelProps = {
  quote: FeeQuote | null;
  loading: boolean;
  depositChainName: string;
  path: AutoFeePath | null;
  packageUsd: AmountOption;
};

export function AutoFeeQuotePanel({
  quote,
  loading,
  depositChainName,
  path,
  packageUsd,
}: AutoFeeQuotePanelProps) {
  const pathLabel = path ? autoFeePathLabel(path) : "—";

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
          Otomatik ücret
        </p>
        <span className="rounded-full border border-emerald-500/30 px-2 py-0.5 text-[9px] text-emerald-400/90">
          {pathLabel}
        </span>
      </div>

      {path === "paymaster_usdc" && (
        <>
          <p className="text-center text-lg font-semibold text-white">
            {formatPackageUsd(packageUsd)} USDC
          </p>
          <p className="text-center text-[10px] text-neutral-500">
            {depositChainName} · PumpPaymaster havuzundan gas → hedef adres
          </p>
        </>
      )}

      {path === "erc4337_relay" && (
        <>
          <p className="text-center text-lg font-semibold text-white">
            {formatPackageUsd(packageUsd)} USDC
          </p>
          <p className="text-center text-[10px] text-neutral-500">
            Gasless — ERC-4337 relayer + paymaster postOp
          </p>
        </>
      )}

      {path === "native_settlement" && loading && (
        <p className="text-center text-[11px] text-neutral-500">Quote hesaplanıyor…</p>
      )}

      {path === "native_settlement" && !loading && quote && (
        <>
          <p className="text-center text-lg font-semibold text-white">
            {formatNativePaymentDisplay(quote)}
          </p>
          <p className="text-center text-[10px] text-neutral-500">
            {depositChainName} → GASSTATION kasası · Settlement gas teslimi
          </p>
          {quote.gasCostUsd != null && (
            <p className="text-center text-[10px] text-neutral-600">
              ~${quote.gasCostUsd.toFixed(3)} gas maliyeti
            </p>
          )}
        </>
      )}

      {path === "native_settlement" && !loading && !quote && (
        <p className="text-center text-[11px] text-amber-400/90">
          Quote alınamadı — quote engine çalışıyor mu?
        </p>
      )}

      {!path && !loading && (
        <p className="text-center text-[11px] text-amber-400/90">
          Yetersiz bakiye — native veya USDC (paymaster ağı) gerekli
        </p>
      )}
    </div>
  );
}
