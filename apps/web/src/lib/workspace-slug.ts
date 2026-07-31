/** Matches backend RegisterDto tenantId validation. */
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38})?[a-z0-9]$/;

export function normalizeWorkspaceSlug(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function isValidWorkspaceSlug(slug: string) {
  return SLUG_RE.test(slug);
}

export function workspaceAuthPath(slug: string, action: "login" | "register") {
  return `/t/${slug}/${action}`;
}
