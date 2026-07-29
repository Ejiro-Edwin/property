import { NextResponse } from "next/server";

const TOKEN_COOKIE = "ts_token";

function apiBase() {
  return process.env.API_BASE_URL || "http://localhost:3100/api/v1";
}

export async function POST(req: Request) {
  const body = await req.json();

  const upstream = await fetch(`${apiBase()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const token = data?.accessToken;
  const res = NextResponse.json({ ok: true, user: data?.user });
  if (typeof token === "string" && token.length > 0) {
    res.cookies.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return res;
}

