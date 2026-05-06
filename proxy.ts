import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/src/lib/auth";
import { getRoleHomePath } from "@/src/lib/roleRoutes";

const PROTECTED_ROUTES: { pattern: RegExp; roles: string[] }[] = [
  { pattern: /^\/dashboard\/unit-head/, roles: ["UNIT_HEAD"] },
  { pattern: /^\/dashboard\/core-leader/, roles: ["CORE_LEADER"] },
  { pattern: /^\/dashboard\/admin/, roles: ["ADMIN"] },
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/graphql") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const matched = PROTECTED_ROUTES.find((route) => route.pattern.test(pathname));
  if (!matched) return NextResponse.next();

  const user = getUserFromRequest(req);

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!matched.roles.includes(user.role)) {
    return NextResponse.redirect(
      new URL(getRoleHomePath(user.role), req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
