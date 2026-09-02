import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <AuthShell
      eyebrow="Everything you need for a better rental experience"
      title="Renting made simple. Living made better."
      description="A calmer way for landlords, tenants and agents to manage every part of the tenancy."
    >
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <div className="text-2xl font-bold tracking-tight text-teal">Welcome to TenantSea</div>
          <div className="mt-2 text-sm text-muted">Your rental journey starts here.</div>
        </div>
        <div className="mt-8 grid gap-3">
          <Link href="/register">
            <Button className="w-full bg-[var(--auth-lime)] text-teal hover:bg-[#a9eb00]">Create an account</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="w-full">I already have an account</Button>
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
