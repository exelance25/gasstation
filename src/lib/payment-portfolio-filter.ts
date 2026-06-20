import type { PaySymbol } from "@/config/payment-assets";
import { getMinOrderUsd } from "@/config/payment-assets";
import type { LivePrices } from "@/lib/oracle/live-prices";
import type { PaymentAssetRow } from "../../hooks/usePaymentPortfolio";

/** Cüzdan içeriğinde gösterilecek ödeme tokenları — dengeli gas tankı */
export const WALLET_DISPLAY_SYMBOLS: PaySymbol[] = ["USDC", "ETH", "BASE", "MON"];

export function rowUsdValue(row: PaymentAssetRow, prices: LivePrices): number {
  switch (row.paySymbol) {
    case "USDC":
      return row.amount;
    case "SOL":
      return row.amount * prices.SOL_Price;
    case "BASE":
      return row.amount * prices.BASE_Price;
    case "MON":
      return row.amount * prices.MON_Price;
    case "ETH":
      return row.amount * prices.ETH_Price;
    default:
      return 0;
  }
}

export function filterSpendableWalletAssets(
  rows: PaymentAssetRow[],
  prices: LivePrices | undefined,
  minUsd = getMinOrderUsd(),
): PaymentAssetRow[] {
  return rows.filter((row) => {
    if (!WALLET_DISPLAY_SYMBOLS.includes(row.paySymbol)) return false;
    if (row.amount <= 0) return false;
    if (!prices) return row.paySymbol === "USDC" && row.amount >= minUsd;
    return rowUsdValue(row, prices) >= minUsd;
  });
}

/** Cüzdan içeriği listesi — $1 altı da gösterilir (ödeme için yetersiz olabilir) */
export function filterWalletDisplayAssets(rows: PaymentAssetRow[]): PaymentAssetRow[] {
  return rows.filter(
    (row) => WALLET_DISPLAY_SYMBOLS.includes(row.paySymbol) && row.amount > 0,
  );
}
