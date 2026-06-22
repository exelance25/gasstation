import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminConfigured } from "@/server/admin/admin-wallet";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/server/admin/admin-session";

export async function GET() {
  if (!isAdminConfigured()) {
    return NextResponse.json({ authenticated: false, configured: false });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = verifyAdminSessionToken(token);

  return NextResponse.json({
    authenticated: Boolean(session),
    configured: true,
  });
}
