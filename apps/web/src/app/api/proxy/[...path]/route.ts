import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TOKEN_COOKIE = "ts_token";

function apiBase() {
  return process.env.API_BASE_URL || "http://localhost:3100/api/v1";
}

async function handler(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const url = new URL(req.url);

  const upstreamUrl = new URL(`${apiBase()}/${path.join("/")}`);
  url.searchParams.forEach((v, k) => upstreamUrl.searchParams.set(k, v));

  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl.toString(), {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
    });
  } catch {
    return NextResponse.json({ message: "API service is unavailable" }, { status: 503 });
  }

  const contentType = upstream.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await upstream.json().catch(() => ({}))
    : await upstream.text();

  // NextResponse.json expects JSON-serializable input; for text we still wrap it.
  return NextResponse.json(payload as unknown, { status: upstream.status });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;

