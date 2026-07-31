import { Mark } from "@/components/brand/mark";
import Link from "next/link";
import { cookies } from "next/headers";
import { AuthHeaderNav } from "@/components/app/auth-header-nav";

const TOKEN_COOKIE = "ts_token";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const isLoggedIn = Boolean((await cookies()).get(TOKEN_COOKIE)?.value);

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-6 py-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Mark />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">TenantSea</div>
              <div className="text-xs text-muted">Workspace: {tenantId}</div>
            </div>
          </Link>
          <nav className="text-sm text-muted">
            <AuthHeaderNav tenantId={tenantId} isLoggedIn={isLoggedIn} />
          </nav>
        </div>
      </header>
      <main className="flex-1 px-6 pb-16">{children}</main>
    </div>
  );
}
