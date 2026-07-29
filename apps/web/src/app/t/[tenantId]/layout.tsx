import { Mark } from "@/components/brand/mark";
import Link from "next/link";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-6 py-6">
        <div className="mx-auto w-full max-w-6xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Mark />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">
                TenantSea
              </div>
              <div className="text-xs text-muted">Tenant: {tenantId}</div>
            </div>
          </Link>
          <nav className="text-sm text-muted">
            <Link href={`/t/${tenantId}/login`} className="hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 px-6 pb-16">{children}</main>
    </div>
  );
}

