import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isQuickLoginEnabled, QUICK_LOGIN_TOKEN } from "@/config/quick-login";

const SESSION_COOKIE = "ob_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function attachSessionCookie(response: NextResponse, token: string, secure: boolean) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  if (body.quick === true && !isQuickLoginEnabled()) {
    return NextResponse.json({ error: "Quick login disabled" }, { status: 403 });
  }

  const token =
    body.quick === true
      ? QUICK_LOGIN_TOKEN
      : typeof body.token === "string"
        ? body.token
        : crypto.randomUUID();

  const secure = request.nextUrl.protocol === "https:";
  const response = NextResponse.json({ ok: true, authenticated: true, expiresIn: MAX_AGE });
  attachSessionCookie(response, token, secure);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return NextResponse.json({ authenticated: Boolean(session?.value) });
}
