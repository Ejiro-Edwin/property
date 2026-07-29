import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "ts_token";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/t/")) return NextResponse.next();

  const isAppRoute = pathname.includes("/app");
  if (!isAppRoute) return NextResponse.next();

  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (token) return NextResponse.next();

  // Redirect to tenant login page.
  const parts = pathname.split("/").filter(Boolean);
  const tenantId = parts[1];
  const url = req.nextUrl.clone();
  url.pathname = `/t/${tenantId}/login`;
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/t/:path*"],
};

