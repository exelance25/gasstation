import type { PumpButtonBlockReason } from "@/hooks/useGasPump";

const BLOCK_TITLES: Partial<Record<NonNullable<PumpButtonBlockReason>, string>> = {
  wallet: "Cüzdan gerekli",
  invalid_amount: "Miktar gerekli",
  deposit_network: "Ödeme kaynağı seçin",
  invalid_target: "Hedef adres gerekli",
  below_minimum: "Yetersiz bakiye",
  insufficient_usdc: "Yetersiz USDC",
  insufficient_native: "Yetersiz bakiye",
  collector: "Kasa yapılandırılmamış",
  tank_empty: "Gas tankı hazır değil",
  precheck_loading: "Kontrol ediliyor",
  automatic_soon: "Otomatik mod kapalı",
  treasury_native: "Native kasa eksik",
  auto_quote: "Ücret hesaplanıyor",
  insufficient_usdc_paymaster: "Yetersiz USDC",
  paymaster_chain: "Paymaster ağı gerekli",
};

export function getPumpBlockTitle(reason: PumpButtonBlockReason): string | null {
  if (!reason || reason === "pumping") return null;
  return BLOCK_TITLES[reason] ?? "İşlem şu an yapılamıyor";
}

export function getPumpBlockMessage(
  reason: PumpButtonBlockReason,
  detail?: string | null,
): string | null {
  if (!reason || reason === "pumping") return null;

  if (detail) return detail;

  switch (reason) {
    case "wallet":
      return "Ödeme için EVM cüzdanınızı bağlayın.";
    case "invalid_amount":
      return "Almak istediğiniz gas miktarını yazın.";
    case "deposit_network":
      return "USDC, ETH, BASE veya MON ile ödeme kaynağı seçin.";
    case "invalid_target":
      return "Gas gönderilecek geçerli bir hedef adresi girin.";
    case "below_minimum":
    case "insufficient_usdc":
    case "insufficient_native":
      return "Seçili ödeme kaynağında bu işlem için yeterli bakiye yok.";
    case "collector":
      return "GASSTATION kasası henüz hazır değil.";
    case "tank_empty":
      return "Operatör kasasında teslimat için yeterli ETH / BASE / MON yok.";
    case "precheck_loading":
      return "Gas tankı bakiyesi doğrulanıyor…";
    case "automatic_soon":
      return "Manuel modu kullanın.";
    default:
      return null;
  }
}
