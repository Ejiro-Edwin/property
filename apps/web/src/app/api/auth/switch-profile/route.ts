import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const TOKEN_COOKIE = "ts_token";

function apiBase() {
  return process.env.API_BASE_URL || "http://localhost:3100/api/v1";
}

export async function POST(req: Request) {
  const body = await req.json();
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;

  const upstream = await fetch(`${apiBase()}/auth/switch-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ role: body.role }),
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const payload = data?.data ?? data;
  const accessToken = payload?.accessToken;
  const res = NextResponse.json({
    ok: true,
    user: payload?.user,
    profiles: payload?.profiles,
    message: payload?.message,
  });

  if (typeof accessToken === "string" && accessToken.length > 0) {
    res.cookies.set(TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return res;
}
