import { redirect } from "next/navigation";

export default async function TenantLoginRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { tenantId } = await params;
  const { next } = await searchParams;
  const q = new URLSearchParams({ workspace: tenantId });
  if (next) q.set("next", next);
  redirect(`/login?${q.toString()}`);
}
