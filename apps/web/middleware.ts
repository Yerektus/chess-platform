import { refreshTokenCookieName } from "@/lib/api";
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hasRefreshToken = Boolean(request.cookies.get(refreshTokenCookieName)?.value);

  if (hasRefreshToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);

  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/game/:path*", "/profile"]
};
