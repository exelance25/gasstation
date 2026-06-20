import { NextRequest, NextResponse } from "next/server";
import { isQuickLoginEnabled, QUICK_LOGIN_TOKEN } from "@/config/quick-login";

const SESSION_COOKIE = "ob_session";
const MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Sets session cookie and redirects — most reliable dev login path.
 * Client: window.location.href = '/api/auth/enter'
 */
export async function GET(request: NextRequest) {
  if (!isQuickLoginEnabled()) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  const raw = request.nextUrl.searchParams.get("redirect") ?? "/";
  const redirectPath = raw.startsWith("/") ? raw : "/";

  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  response.cookies.set(SESSION_COOKIE, QUICK_LOGIN_TOKEN, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE
  });

  return response;
}
