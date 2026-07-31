import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "ts_token";

function tenantIdFromToken(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { tenantId?: string };
    return json.tenantId ?? null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(TOKEN_COOKIE)?.value;

  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  ) {
    if (token) {
      const tenantId = tenantIdFromToken(token);
      if (tenantId) {
        const url = req.nextUrl.clone();
        url.pathname = `/t/${tenantId}/app`;
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  if (!pathname.startsWith("/t/")) return NextResponse.next();

  const parts = pathname.split("/").filter(Boolean);
  const tenantId = parts[1];
  const segment = parts[2];

  const isAppRoute = segment === "app";
  const isAuthEntry =
    segment === "login" ||
    segment === "register" ||
    segment === "forgot-password";

  if (token && isAuthEntry) {
    const url = req.nextUrl.clone();
    url.pathname = `/t/${tenantId}/app`;
    return NextResponse.redirect(url);
  }

  if (!isAppRoute) return NextResponse.next();

  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/login`;
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/login", "/register", "/forgot-password", "/t/:path*"],
};
