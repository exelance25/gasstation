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
    blob.includes("user rejected") ||
    blob.includes("user denied") ||
    blob.includes("rejected the request") ||
    blob.includes("iptal")
  ) {
    return messages.errors.cancelled;
  }
  if (
    blob.includes("insufficient funds") ||
    blob.includes("yetersiz") ||
    blob.includes("insufficient balance")
  ) {
    return messages.errors.insufficient;
  }
  if (
    blob.includes("operatör likiditesi") ||
    blob.includes("likidite") ||
    blob.includes("tankı") ||
    blob.includes("tank")
  ) {
    return messages.errors.tankEmpty;
  }
  if (
    blob.includes("doğrulanamadı") ||
    blob.includes("treasury") ||
    blob.includes("transferi okunamadı")
  ) {
    return messages.errors.depositMismatch;
  }
  if (blob.includes("chain") && blob.includes("match")) {
    return messages.errors.wrongChain;
  }
  if (blob.includes("unsupported chain") || blob.includes("unrecognized chain")) {
    return messages.errors.chainNotAdded;
  }
  if (blob.includes("collector") || blob.includes("kasa")) {
    return messages.errors.collectorMissing;
  }
  if (blob.includes("abort") || blob.includes("timed out") || blob.includes("timeout")) {
    return messages.errors.timeout;
  }
  if (blob.includes("execution reverted") || blob.includes("transfer amount exceeds")) {
    return messages.errors.insufficient;
  }
  if (blob.includes("network") && blob.includes("switch")) {
    return messages.errors.wrongChain;
  }

  const raw = parts.join(" ").trim();
  return raw || messages.errors.unknown;
}
