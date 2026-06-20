import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyMessage } from "viem";
import { isAdminConfigured, isAdminWalletAddress } from "@/server/admin/admin-wallet";
import {
  ADMIN_CHALLENGE_COOKIE,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
} from "@/server/admin/admin-session";

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const address = typeof body.address === "string" ? body.address : "";
  const message = typeof body.message === "string" ? body.message : "";
  const signature = typeof body.signature === "string" ? body.signature : "";

  if (!address || !message || !signature) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const challenge = cookieStore.get(ADMIN_CHALLENGE_COOKIE)?.value;
  if (!challenge || !message.includes(challenge)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!isAdminWalletAddress(address)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let valid = false;
  try {
    valid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    valid = false;
  }

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const token = createAdminSessionToken(address);
  const secure = request.nextUrl.protocol === "https:";
  const response = NextResponse.json({ ok: true, authenticated: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  cookieStore.delete(ADMIN_CHALLENGE_COOKIE);
  return response;
}
