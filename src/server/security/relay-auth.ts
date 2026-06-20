import "server-only";

import { getServerEnv } from "@/config/server-env";

export function isRelayApiKeyConfigured(): boolean {
  const key = process.env.RELAYER_API_KEY?.trim();
  return Boolean(key && key.length >= 16);
}

export function assertRelayAuthorized(request: Request): void {
  const required = process.env.RELAYER_API_KEY?.trim();
  if (!required) {
    const env = getServerEnv();
    if (env.NODE_ENV === "production") {
      throw new Error("RELAYER_API_KEY production ortamında zorunlu");
    }
    return;
  }

  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-relayer-api-key");

  if (header !== required) {
    throw new Error("Relayer API yetkisiz");
  }
}
