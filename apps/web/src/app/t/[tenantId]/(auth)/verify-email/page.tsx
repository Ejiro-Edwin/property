import { redirect } from "next/navigation";

export default async function TenantVerifyEmailRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { tenantId } = await params;
  const { token } = await searchParams;
  const q = new URLSearchParams({ tenantId });
  if (token) q.set("token", token);
  redirect(`/verify-email?${q.toString()}`);
}
