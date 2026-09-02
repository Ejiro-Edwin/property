import { NextResponse } from "next/server";

const TOKEN_COOKIE = "ts_token";

function apiBase() {
  return process.env.API_BASE_URL || "http://localhost:3100/api/v1";
}

export async function POST(req: Request) {
  const body = await req.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ message: "Authentication service is unavailable" }, { status: 503 });
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  // The backend response is wrapped by the response-transform interceptor:
  // { success, data: { accessToken, user, ... }, ... }
  const payload = data?.data ?? data;
  const token = payload?.accessToken;
  const res = NextResponse.json({ ok: true, user: payload?.user, accessToken: token });
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

