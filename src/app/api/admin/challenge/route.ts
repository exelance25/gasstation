import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isAdminConfigured } from "@/server/admin/admin-wallet";
import { ADMIN_CHALLENGE_COOKIE } from "@/server/admin/admin-session";

export async function GET() {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }

  const nonce = crypto.randomUUID();
  const issued = new Date().toISOString();
  const message = `GasStation Admin\nNonce: ${nonce}\nIssued: ${issued}`;

  const response = NextResponse.json({ message });
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_CHALLENGE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  return response;
}
