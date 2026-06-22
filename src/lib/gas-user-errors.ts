import { messages } from "@/i18n/messages";

function stringifyUnknown(error: unknown): string {
  if (error == null) return "";
  if (typeof error === "string") return error.trim();
  if (error instanceof Error) return error.message.trim();
  if (typeof error === "object") {
    const o = error as Record<string, unknown>;
    if (typeof o.message === "string") return o.message.trim();
    if (typeof o.shortMessage === "string") return o.shortMessage.trim();
    if (typeof o.reason === "string") return o.reason.trim();
    if (typeof o.error === "string") return o.error.trim();
    if (typeof o.code === "number") {
      if (o.code === 4001) return messages.errors.cancelled;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

function isInternalOperatorMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("operatör") ||
    lower.includes("operator likid") ||
    lower.includes("gas tank") ||
    lower.includes("tankı") ||
    lower.includes("kasada") ||
    (lower.includes("0x") && lower.includes("gerekli"))
  );
}

/** User-facing transaction errors (English) */
export function formatGasUserError(error: unknown): string {
  const raw = stringifyUnknown(error);
  if (!raw) return messages.errors.unknown;

  const blob = raw.toLowerCase();

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
    blob.includes("yetersiz") ||
    blob.includes("execution reverted")
  ) {
    return messages.errors.insufficient;
  }
  if (blob.includes("doğrulanamadı") || blob.includes("treasury")) {
    return messages.errors.depositMismatch;
  }
  if (blob.includes("unsupported chain") || blob.includes("unrecognized chain")) {
    return messages.errors.chainNotAdded;
  }
  if (blob.includes("abort") || blob.includes("timed out") || blob.includes("timeout")) {
    return messages.errors.timeout;
  }

  if (isInternalOperatorMessage(raw)) {
    return messages.errors.deliveryUnavailable;
  }

  return raw;
}
