import Link from "next/link";
import { Mark } from "@/components/brand/mark";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page min-h-dvh px-4 py-4 sm:px-6 sm:py-6">
      <div className="auth-frame mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-6xl overflow-hidden sm:min-h-[calc(100dvh-3rem)] lg:grid-cols-[1fr_1.05fr]">
        <section className="auth-pitch relative flex min-h-[320px] flex-col justify-between overflow-hidden p-7 sm:p-10 lg:min-h-0 lg:p-14">
          <div className="relative z-10 flex items-center gap-3 text-white">
            <Mark />
            <span className="text-sm font-bold tracking-tight">TenantSea</span>
          </div>
          <div className="relative z-10 max-w-md pb-4 lg:pb-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime">{eyebrow ?? "Rental, made clear"}</p>
            <h1 className="mt-5 text-4xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-5xl">{title}</h1>
            {description ? <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">{description}</p> : null}
          </div>
          <div className="auth-pitch-shape auth-pitch-shape-one" />
          <div className="auth-pitch-shape auth-pitch-shape-two" />
        </section>
        <section className="auth-form flex flex-col justify-center p-6 sm:p-12 lg:p-16">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-xs font-semibold text-teal hover:underline">Back to home</Link>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}