import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = new Set(["/splash", "/welcome", "/login", "/register", "/onboarding"]);

/** GasStation — oturum gerektirmez; herkes YAKIT AL */
const gasStationPaths = new Set(["/", "/yakit-al", "/gas-havuzu"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // WalletConnect / Reown allowlist — localhost kullan (127.0.0.1 ayrı origin sayılır)
  if (
    process.env.NODE_ENV === "development" &&
    request.nextUrl.hostname === "127.0.0.1"
  ) {
    const url = request.nextUrl.clone();
    url.hostname = "localhost";
    return NextResponse.redirect(url);
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/yakit-al", request.url));
  }

  if (gasStationPaths.has(pathname)) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get("ob_session")?.value);

  if (
    hasSession &&
    (pathname === "/splash" ||
      pathname === "/welcome" ||
      pathname === "/login" ||
      pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/yakit-al", request.url));
  }

  if (pathname === "/splash" || publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  if (!hasSession) {
    const loginUrl = new URL("/welcome", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
