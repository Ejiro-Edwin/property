import Link from "next/link";
import { Mark } from "@/components/brand/mark";

export default function AuthGateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-6 py-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Mark />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">TenantSea</div>
              <div className="text-xs text-muted">Rent, trust and tenancies</div>
            </div>
          </Link>
        </div>
      </header>
      <main className="flex-1 px-6 pb-16">{children}</main>
    </div>
  );
}
