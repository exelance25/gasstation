export function formatFiat(value: number, currency: "USD" | "EUR" | "TRY" = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}
