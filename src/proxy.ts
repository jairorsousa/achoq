import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "achoq_session";

const PUBLIC_PATHS = ["/login", "/verify", "/onboarding"];
const ADMIN_PATHS = ["/admin"];
const AUTH_PATHS = ["/home", "/explorar", "/ranking", "/lojinha", "/perfil", "/event", "/grupos"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuthenticated = Boolean(session);

  // Admin check (basic — real check happens client-side with custom claim)
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // If authenticated and trying to access auth pages → redirect to home
  if (isAuthenticated && PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // If not authenticated and trying to access protected pages → redirect to login
  if (!isAuthenticated && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-|design-system).*)",
  ],
};
