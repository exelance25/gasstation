"use client";

import type { Address } from "viem";
import { useAutoGasApprove } from "@/hooks/useAutoGasApprove";
import { usePaymasterContract } from "@/hooks/usePaymasterContract";
import { isFeeTokenConfigured } from "@/config/pool-tokens";

interface PaymasterPoolBadgeProps {
  userAddress?: Address;
  disabled?: boolean;
}

/** Otomatik mod: fee token approve durumu */
export function PaymasterPoolBadge({ userAddress, disabled }: PaymasterPoolBadgeProps) {
  const { isDeployed, poolNativeFormatted, allowanceWei } =
    usePaymasterContract(userAddress);
  const { approve, isPending } = useAutoGasApprove();

  if (!isDeployed) {
    return (
      <p className="text-[11px] text-gray-500">
        Paymaster adresi yok — stub sponsor kullanılıyor.
      </p>
    );
  }

  const hasAllowance = allowanceWei > 0n;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-charcoal/60 px-3 py-2">
      <div className="text-[11px] text-gray-400 md:text-xs">
        <span className="font-semibold text-neon-accent-green">Havuz ETH</span>{" "}
        {poolNativeFormatted} ·{" "}
        <span className="text-gray-200">
          Fee izni: {hasAllowance ? "✓" : "gerekli"}
        </span>
      </div>
      {isFeeTokenConfigured() && !hasAllowance && (
        <button
          type="button"
          disabled={disabled || isPending || !userAddress}
          onClick={() => void approve()}
          className="rounded-md border border-neon-accent-green/50 px-2 py-1 text-[10px] font-bold uppercase text-neon-accent-green hover:bg-neon-accent-green/10 disabled:opacity-40"
        >
          Approve
        </button>
      )}
    </div>
  );
}
