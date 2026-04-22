import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const AUTH_COOKIE = "portaria-auth-status";
const publicPaths = ["/login"];
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuthCookie = request.cookies.has(AUTH_COOKIE);
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    if (hasAuthCookie) return NextResponse.redirect(new URL("/dashboard", request.url));
    return NextResponse.next();
  }
  if (!hasAuthCookie) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}
export const config = {
  matcher: ["/dashboard/:path*", "/condominios/:path*", "/chamadas/:path*", "/auditoria/:path*", "/login"],
};
