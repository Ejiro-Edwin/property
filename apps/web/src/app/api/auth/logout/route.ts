import { NextResponse } from "next/server";

const TOKEN_COOKIE = "ts_token";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const redirectTo = url.searchParams.get("redirect") || "/";
  const res = NextResponse.redirect(new URL(redirectTo, req.url));
  res.cookies.set(TOKEN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
