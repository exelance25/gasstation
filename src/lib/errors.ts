/** Uygulama genelinde yakalanan hata türleri */
export type GasPumpErrorCode =
  | "INSUFFICIENT_BALANCE"
  | "INSUFFICIENT_GAS"
  | "WRONG_NETWORK"
  | "WALLET_MISMATCH"
  | "GAS_SPONSOR_FAILED"
  | "TRANSACTION_FAILED"
  | "UNKNOWN";

export class GasPumpError extends Error {
  readonly code: GasPumpErrorCode;

  constructor(code: GasPumpErrorCode, message: string) {
    super(message);
    this.name = "GasPumpError";
    this.code = code;
  }
}

export const ERROR_MESSAGES: Record<GasPumpErrorCode, string> = {
  INSUFFICIENT_BALANCE: "Yetersiz bakiye — ödeme ağındaki cüzdanınızda yeterli ETH yok.",
  INSUFFICIENT_GAS:
    "Yetersiz gas — Manuel modda Base üzerinde native ETH gerekir. Otomatik moda geçin.",
  WRONG_NETWORK: "Yanlış ağ — lütfen cüzdanınızı doğru ağa geçirin.",
  WALLET_MISMATCH:
    "Cüzdan uyuşmazlığı — kaynak ve hedef aynı adreste olamaz veya ağlar uyumsuz.",
  GAS_SPONSOR_FAILED: "GASSTATION gas sponsor başarısız — lütfen tekrar deneyin.",
  TRANSACTION_FAILED: "İşlem başarısız — lütfen tekrar deneyin.",
  UNKNOWN: "Beklenmeyen bir hata oluştu.",
};

export function getErrorMessage(code: GasPumpErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN;
}
