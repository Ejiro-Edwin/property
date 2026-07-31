import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return <AppShell tenantId={tenantId}>{children}</AppShell>;
}
