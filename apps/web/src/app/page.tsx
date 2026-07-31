import { Mark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { IconBuilding, IconCard, IconShield } from "@/components/ui/icons";

export default function Home() {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-6 py-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Mark />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">TenantSea</div>
              <div className="text-xs text-muted">Rent, trust and tenancies</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="secondary">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 pb-16">
        <div className="mx-auto grid w-full max-w-6xl gap-12 pt-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div className="grid max-w-xl gap-5">
              <Badge tone="sand" className="w-fit">
                Property management, minus the noise
              </Badge>
              <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight md:text-5xl">
                Every property, tenancy and rent payment—in one calm place.
              </h1>
              <p className="text-base leading-7 text-muted">
                TenantSea gives landlords and letting agents a clear view of
                their portfolio: who lives where, what&apos;s due, what&apos;s
                paid, and which tenants have earned trust.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/register">
                  <Button size="lg">Start managing</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="secondary">
                    Sign in to your workspace
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-5 pt-2 text-xs text-muted">
                <span>Multi-tenant workspaces</span>
                <span aria-hidden>·</span>
                <span>Payment schedules</span>
                <span aria-hidden>·</span>
                <span>Explainable trust scores</span>
              </div>
            </div>

            <div className="relative hidden min-h-[420px] lg:block">
              <div className="property-art absolute inset-0 rounded-[24px]" />

              <div className="card absolute left-6 top-8 w-[260px] p-4">
                <div className="property-art h-28 rounded-[12px]" />
                <div className="mt-3 text-sm font-semibold tracking-tight">
                  12 Marina Crescent, Lekki
                </div>
                <div className="mt-0.5 text-xs text-muted">3 bedrooms · Lagos</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm font-semibold">₦4,500,000 / yr</div>
                  <Badge tone="success">Occupied</Badge>
                </div>
              </div>

              <div className="card absolute bottom-10 right-4 w-[250px] p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">
                  Rent collected · July
                </div>
                <div className="mt-1 text-2xl font-semibold tracking-tight">
                  ₦9.2m
                </div>
                <div className="mt-3 grid gap-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Adaeze O. — Flat 2B</span>
                    <Badge tone="success">Paid</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Tunde A. — Flat 4A</span>
                    <Badge tone="sand">Due 28 Jul</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Chidi N. — Duplex 1</span>
                    <Badge tone="warning">3 days late</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight">
                Built for the whole tenancy, not just the rent
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                One workspace for your properties, your people and your money —
                each part talking to the others.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="card flex flex-col p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand-soft text-brand-ink">
                  <IconBuilding width={20} height={20} />
                </div>
                <div className="mt-4 text-sm font-semibold tracking-tight">
                  Your portfolio, organized
                </div>
                <div className="mt-2 text-sm leading-6 text-muted">
                  Properties, units and tenancies grouped per workspace —
                  isolated per organization and enforced by the API.
                </div>
                <div className="mt-4 grid gap-2 border-t border-border pt-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">12 Marina Crescent</span>
                    <Badge tone="success">Occupied</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Flat 4A, Yaba</span>
                    <Badge tone="sand">Vacant</Badge>
                  </div>
                </div>
              </div>

              <div className="card flex flex-col p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand-soft text-brand-ink">
                  <IconCard width={20} height={20} />
                </div>
                <div className="mt-4 text-sm font-semibold tracking-tight">
                  Rent that runs itself
                </div>
                <div className="mt-2 text-sm leading-6 text-muted">
                  Recurring schedules, automatic overdue detection and
                  reconciliation — the right people notified, every time.
                </div>
                <div className="mt-4 grid gap-2 border-t border-border pt-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Yearly · due 28 Jul</span>
                    <span className="font-medium">₦4.5m</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/6">
                    <div className="h-full w-[72%] rounded-full bg-brand" />
                  </div>
                  <div className="text-muted">72% collected this cycle</div>
                </div>
              </div>

              <div className="card flex flex-col p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand-soft text-brand-ink">
                  <IconShield width={20} height={20} />
                </div>
                <div className="mt-4 text-sm font-semibold tracking-tight">
                  Trust you can explain
                </div>
                <div className="mt-2 text-sm leading-6 text-muted">
                  Tenant trust scores built from real payment behavior and
                  tenancy history — not a black box.
                </div>
                <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
                  <div className="text-3xl font-semibold tracking-tight text-success">
                    86
                  </div>
                  <div className="grid gap-0.5 text-xs text-muted">
                    <span>11 payments on time</span>
                    <span>0 missed · 1 late</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-10 text-xs text-muted">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <span>© {new Date().getFullYear()} TenantSea</span>
          <span className="text-muted/80">Built with care.</span>
        </div>
      </footer>
    </div>
  );
}
