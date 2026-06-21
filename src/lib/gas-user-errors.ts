import { messages } from "@/i18n/messages";

/** User-facing transaction errors (English) */
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

  if (
    blob.includes("operatör") ||
    blob.includes("operator likid") ||
    blob.includes("gas tank") ||
    blob.includes("tankı") ||
    blob.includes("kasada") ||
    blob.includes("likidite")
  ) {
    return messages.errors.deliveryUnavailable;
  }

  if (
    blob.includes("user rejected") ||
    blob.includes("user denied") ||
    blob.includes("rejected the request") ||
    blob.includes("cancelled in wallet")
  ) {
    return messages.errors.cancelled;
  }
  if (
    blob.includes("insufficient funds") ||
    blob.includes("insufficient balance") ||
    blob.includes("yetersiz")
  ) {
    return messages.errors.insufficient;
  }
  if (blob.includes("doğrulanamadı") || blob.includes("treasury")) {
    return messages.errors.depositMismatch;
  }
  if (blob.includes("chain") && blob.includes("match")) {
    return messages.errors.wrongChain;
  }
  if (blob.includes("unsupported chain") || blob.includes("unrecognized chain")) {
    return messages.errors.chainNotAdded;
  }
  if (blob.includes("abort") || blob.includes("timed out") || blob.includes("timeout")) {
    return messages.errors.timeout;
  }
  if (blob.includes("execution reverted") || blob.includes("transfer amount exceeds")) {
    return messages.errors.insufficient;
  }

  const raw = parts.join(" ").trim();
  if (raw.includes("0x") && (raw.includes("ETH") || raw.includes("MON") || raw.includes("operator"))) {
    return messages.errors.deliveryUnavailable;
  }
  return raw || messages.errors.unknown;
}
