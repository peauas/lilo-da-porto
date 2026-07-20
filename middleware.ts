import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth-edge";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
const authApiRoutes = ["/api/auth"];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isLoggedIn = !!request.auth;

  const isPublic =
    publicRoutes.some((r) => pathname.startsWith(r)) ||
    authApiRoutes.some((r) => pathname.startsWith(r));

  if (isPublic) {
    if ((pathname === "/login" || pathname === "/register") && isLoggedIn) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/auth") || pathname === "/api/health") {
      return NextResponse.next();
    }
    if (!isLoggedIn) {
      const authHeader = request.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Não autorizado" } },
          { status: 401 },
        );
      }
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
