import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16: o middleware foi renomeado para "proxy" (runtime Node.js).
// Serve para redirecionar rotas sem sessão antes de chegarem nas páginas.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const hasSession =
    request.cookies.has("better-auth.session_token") ||
    request.cookies.has("__Secure-better-auth.session_token");

  if (isAdminRoute && !hasSession) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
