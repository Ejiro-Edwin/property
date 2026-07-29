export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type Json = Record<string, unknown>;

/**
 * Calls the backend through the Next.js proxy route, which attaches the
 * auth cookie as a Bearer token. `tenantId` is injected automatically:
 * into query params for GET, into the JSON body otherwise.
 */
export async function api<T = unknown>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    tenantId?: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: Json;
  } = {},
): Promise<T> {
  const method = opts.method ?? "GET";
  const url = new URL(`/api/proxy/${path.replace(/^\//, "")}`, window.location.origin);

  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  if (opts.tenantId && method === "GET") {
    url.searchParams.set("tenantId", opts.tenantId);
  }

  const body =
    method === "GET"
      ? undefined
      : JSON.stringify({ ...(opts.body ?? {}), ...(opts.tenantId ? { tenantId: opts.tenantId } : {}) });

  const res = await fetch(url.toString(), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { message?: string | string[] })?.message ?? "Request failed";
    throw new ApiError(Array.isArray(message) ? message.join(", ") : message, res.status);
  }

  // Backend wraps responses in { data } via ResponseTransformInterceptor.
  return ((data as { data?: T })?.data ?? data) as T;
}
