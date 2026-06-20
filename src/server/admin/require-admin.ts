import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/server/admin/admin-session";
import { isAdminConfigured } from "@/server/admin/admin-wallet";

export async function getAdminSession() {
  if (!isAdminConfigured()) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    return {
      session: null as null,
      error: NextResponse.json({ error: "Admin oturumu gerekli" }, { status: 401 }),
    };
  }
  return { session, error: null as null };
}
