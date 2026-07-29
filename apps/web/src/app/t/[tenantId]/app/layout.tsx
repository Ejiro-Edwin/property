import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { AppNav } from "@/components/app/nav";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <div className="min-h-dvh flex">
      <aside className="sticky top-0 hidden h-dvh w-[264px] flex-col gap-7 border-r border-border px-4 py-6 md:flex">
        <Link href={`/t/${tenantId}/app`} className="flex items-center gap-3 px-1">
          <Mark />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">TenantSea</div>
            <div className="text-xs text-muted">{tenantId}</div>
          </div>
        </Link>

        <AppNav tenantId={tenantId} />

        <div className="mt-auto px-1">
          <form action="/api/auth/logout" method="post">
            <button className="text-sm text-muted transition-colors hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <main className="px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
