import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { getServerEnv } from "@/config/server-env";
import { getAdminWalletAddress } from "@/server/admin/admin-wallet";

export const ADMIN_SESSION_COOKIE = "pump_admin";
export const ADMIN_CHALLENGE_COOKIE = "pump_admin_challenge";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24;

function sessionSecret(): string {
  const env = getServerEnv();
  if (env.API_SECRET_KEY) return env.API_SECRET_KEY;
  if (env.SESSION_ENCRYPTION_KEY) return env.SESSION_ENCRYPTION_KEY;

  const appEnv = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
  const admin = getAdminWalletAddress();

  if (env.NODE_ENV === "production" && appEnv === "mainnet") {
    throw new Error(
      "Production mainnet: API_SECRET_KEY veya SESSION_ENCRYPTION_KEY zorunlu",
    );
  }

  if (admin) {
    return `pump-admin-${appEnv}:${admin.toLowerCase()}`;
  }

  throw new Error("ADMIN_WALLET_ADDRESS veya operatör cüzdanı yapılandırılmamış");
}

function signPayload(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createAdminSessionToken(address: string): string {
  const exp = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const payload = `${address.toLowerCase()}.${exp}`;
  const sig = signPayload(payload);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyAdminSessionToken(
  token: string | undefined,
): { address: `0x${string}` } | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot <= 0) return null;
    const payload = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const expected = signPayload(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const [addr, expStr] = payload.split(".");
    const exp = Number(expStr);
    if (!addr || !Number.isFinite(exp) || Date.now() > exp) return null;

    const admin = getAdminWalletAddress();
    if (!admin || addr !== admin.toLowerCase()) return null;

    return { address: admin };
  } catch {
    return null;
  }
}
