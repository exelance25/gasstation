/** WalletConnect / wagmi websocket gürültüsü — kullanıcıya hata ekranı gösterme */
export function isWalletConnectNoise(reason: unknown): boolean {
  const parts: string[] = [];

  const collect = (value: unknown, depth = 0) => {
    if (depth > 4 || value == null) return;
    if (value instanceof Error) {
      parts.push(value.message, value.name, value.stack ?? "");
      if ("cause" in value) collect(value.cause, depth + 1);
      return;
    }
    if (typeof value === "string") {
      parts.push(value);
      return;
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (typeof obj.message === "string") parts.push(obj.message);
      if (typeof obj.shortMessage === "string") parts.push(obj.shortMessage);
      if (typeof obj.details === "string") parts.push(obj.details);
      try {
        parts.push(JSON.stringify(value));
      } catch {
        parts.push(String(value));
      }
    }
  };

  collect(reason);
  const blob = parts.join(" ").toLowerCase();

  return (
    blob.includes("connection interrupted") ||
    blob.includes("trying to subscribe") ||
    blob.includes("subscribe") ||
    blob.includes("walletconnect") ||
    blob.includes("websocket") ||
    blob.includes("relay") ||
    blob.includes("allowlist") ||
    blob.includes("cloud.reown.com") ||
    blob.includes("not found on allowlist") ||
    blob.includes("user rejected") ||
    blob.includes("user denied")
  );
}
