/** Kullanıcıya gösterilecek Türkçe işlem hataları */
export function formatGasUserError(error: unknown): string {
  const parts: string[] = [];
  const collect = (value: unknown, depth = 0) => {
    if (depth > 4 || value == null) return;
    if (value instanceof Error) {
      parts.push(value.message);
      if ("shortMessage" in value && typeof value.shortMessage === "string") {
        parts.push(value.shortMessage);
      }
      if ("cause" in value) collect(value.cause, depth + 1);
      return;
    }
    if (typeof value === "string") parts.push(value);
  };
  collect(error);
  const blob = parts.join(" ").toLowerCase();

  if (blob.includes("user rejected") || blob.includes("user denied") || blob.includes("rejected the request")) {
    return "İşlem cüzdanınızda iptal edildi.";
  }
  if (blob.includes("insufficient funds") || blob.includes("yetersiz")) {
    return "Cüzdanınızda bu ödeme için yeterli bakiye yok.";
  }
  if (blob.includes("operatör likiditesi") || blob.includes("likidite")) {
    return "Gas tankı boş veya yetersiz — operatör kasasına Sepolia ETH / Base ETH / MON yükleyin.";
  }
  if (blob.includes("doğrulanamadı") || blob.includes("treasury")) {
    return "Ödeme kasaya ulaşmadı veya tutar eşleşmedi. Ağ ve miktarı kontrol edin.";
  }
  if (blob.includes("chain") && blob.includes("match")) {
    return "MetaMask yanlış ağda — ödeme ağına geçin ve tekrar deneyin.";
  }
  if (blob.includes("unsupported chain") || blob.includes("unrecognized chain")) {
    return "Bu ağ MetaMask'ta ekli değil — Sepolia, Base Sepolia veya Monad Testnet ekleyin.";
  }
  if (blob.includes("collector") || blob.includes("kasa")) {
    return "GASSTATION kasası yapılandırılmamış (.env.local COLLECTOR_ADDRESS).";
  }
  if (blob.includes("abort")) {
    return "Sunucu yanıt vermedi — bağlantıyı kontrol edip tekrar deneyin.";
  }

  const raw = parts.join(" ").trim();
  return raw || "İşlem tamamlanamadı — bilinmeyen hata.";
}
