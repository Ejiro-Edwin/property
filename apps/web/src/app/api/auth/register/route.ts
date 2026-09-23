import { NextResponse } from "next/server";

function apiBase() {
  return process.env.API_BASE_URL || "http://localhost:3100/api/v1";
}

export async function POST(req: Request) {
  const body = await req.json();
  let upstream: Response;

  try {
    upstream = await fetch(`${apiBase()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ message: "Authentication service is unavailable" }, { status: 503 });
  }

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}