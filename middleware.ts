import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ROLES, ROUTES } from "@/lib/constants";

export default withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
    const userRole = req.nextauth.token?.role;

    if (isAdminRoute && userRole !== ROLES.ADMIN) {
      return NextResponse.redirect(new URL(ROUTES.DASHBOARD, req.url));
    }

    return NextResponse.next();
  },
  {
    pages: { signIn: ROUTES.LOGIN },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
