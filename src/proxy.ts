import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/register";

  if (isAuthPage && session) return NextResponse.redirect(new URL("/dashboard", request.url));
  if (!isAuthPage && !session) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${path}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/resumes/:path*",
    "/knowledge/:path*",
    "/jd-match/:path*",
    "/interviews/:path*",
    "/applications/:path*",
    "/agent-chat/:path*",
    "/thread/:path*",
    "/api/career/:path*",
    "/api/agent/:path*",
  ],
};
