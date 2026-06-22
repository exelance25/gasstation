import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/server/admin/admin-wallet";
import { ADMIN_CHALLENGE_COOKIE } from "@/server/admin/admin-session";

export async function GET(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 503 });
  }

  const nonce = crypto.randomUUID();
  const issued = new Date().toISOString();
  const message = `GasStation Admin\nNonce: ${nonce}\nIssued: ${issued}`;

  const secure = new URL(request.url).protocol === "https:";
  const response = NextResponse.json({ message });
  response.cookies.set(ADMIN_CHALLENGE_COOKIE, nonce, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });

  return response;
}
