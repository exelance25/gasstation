import type { PumpButtonBlockReason } from "@/hooks/useGasPump";
import { messages } from "@/i18n/messages";

const BLOCK_TITLES: Partial<Record<NonNullable<PumpButtonBlockReason>, string>> = {
  wallet: messages.pump.walletTitle,
  invalid_amount: messages.pump.amountTitle,
  deposit_network: messages.pump.depositTitle,
  invalid_target: messages.pump.targetTitle,
  below_minimum: messages.pump.balanceTitle,
  insufficient_usdc: messages.pump.balanceTitle,
  insufficient_native: messages.pump.balanceTitle,
  collector: messages.pump.collectorTitle,
  automatic_soon: messages.pump.autoOffTitle,
  treasury_native: messages.pump.treasuryNativeTitle,
  auto_quote: messages.pump.quoteTitle,
  insufficient_usdc_paymaster: messages.pump.paymasterUsdcTitle,
  paymaster_chain: messages.pump.paymasterChainTitle,
};

export function getPumpBlockTitle(reason: PumpButtonBlockReason): string | null {
  if (!reason || reason === "pumping") return null;
  return BLOCK_TITLES[reason] ?? null;
}

export function getPumpBlockMessage(
  reason: PumpButtonBlockReason,
  detail?: string | null,
): string | null {
  if (!reason || reason === "pumping") return null;
  if (detail) return sanitizeUserFacingDetail(detail);

  switch (reason) {
    case "wallet":
      return messages.pump.walletMsg;
    case "invalid_amount":
      return messages.pump.amountMsg;
    case "deposit_network":
      return messages.pump.depositMsg;
    case "invalid_target":
      return messages.pump.targetMsg;
    case "below_minimum":
    case "insufficient_usdc":
    case "insufficient_native":
      return messages.pump.balanceMsg;
    case "collector":
      return messages.pump.collectorMsg;
    case "automatic_soon":
      return messages.pump.autoOffMsg;
    default:
      return null;
  }
}

/** Never expose operator balances, addresses, or internal tank state to users */
export function sanitizeUserFacingDetail(detail: string): string {
  const lower = detail.toLowerCase();
  if (
    lower.includes("operatör") ||
    lower.includes("operator") ||
    lower.includes("tank") ||
    lower.includes("kasada") ||
    lower.includes("treasury") ||
    lower.includes("0x") ||
    lower.includes("sepolia eth gönder") ||
    lower.includes("fund operator")
  ) {
    return messages.errors.deliveryUnavailable;
  }
  return detail;
}
