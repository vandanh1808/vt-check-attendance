import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { ROLES, ROUTES } from "@/lib/constants";

/**
 * Must pick the same session cookie name NextAuth used when signing in.
 * With AUTH_TRUST_HOST, NextAuth decides http/https from the request
 * (x-forwarded-proto), not from NEXTAUTH_URL — withAuth() only looks at
 * NEXTAUTH_URL, which causes a redirect loop when the two disagree.
 */
function usesSecureCookie(req: NextRequest): boolean {
  if (process.env.AUTH_TRUST_HOST) {
    const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim();
    return proto !== "http";
  }
  return process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
}

export default async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: usesSecureCookie(req),
  });

  if (!token) {
    const { pathname, search } = req.nextUrl;
    const loginUrl = new URL(ROUTES.LOGIN, req.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  if (isAdminRoute && token.role !== ROLES.ADMIN) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
