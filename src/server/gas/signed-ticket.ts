import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const VERSION = 1;
const PREFIX = "st1";

/** Vercel / Lambda — yerel disk kalıcı değil */
export function isEphemeralRuntime(): boolean {
  return Boolean(process.env.VERCEL ?? process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function getSigningSecret(): string | null {
  const secret =
    process.env.PUMP_ORDER_SECRET?.trim() ||
    process.env.EVM_OPERATOR_PRIVATE_KEY?.trim() ||
    process.env.OPERATOR_PRIVATE_KEY?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

export function isSignedTicket(value: string): boolean {
  return value.startsWith(`${PREFIX}.`);
}

export function signTicket(payload: Record<string, unknown>): string {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error("Sipariş imzalama anahtarı yapılandırılmamış");
  }
  const body = Buffer.from(JSON.stringify({ v: VERSION, ...payload })).toString(
    "base64url",
  );
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${PREFIX}.${body}.${sig}`;
}

export function verifyTicket<T extends Record<string, unknown>>(
  token: string,
): T | null {
  if (!isSignedTicket(token)) return null;
  const secret = getSigningSecret();
  if (!secret) return null;

  const firstDot = token.indexOf(".");
  const lastDot = token.lastIndexOf(".");
  if (firstDot < 0 || lastDot <= firstDot) return null;

  const body = token.slice(firstDot + 1, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", secret).update(body).digest("base64url");

  try {
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as T & { v?: number };
    if (parsed.v !== VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}
