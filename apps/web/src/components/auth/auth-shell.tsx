import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { cn } from "@/lib/cn";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  titleClassName,
  descriptionClassName,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
}) {
  return (
    <main className="auth-page min-h-dvh px-4 py-4 sm:px-6 sm:py-6">
      <div className="auth-frame mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-[1480px] overflow-hidden rounded-[8px] bg-[#0e524d] sm:min-h-[calc(100dvh-3rem)] lg:grid-cols-[1.42fr_0.92fr]">
        <section className="auth-pitch relative flex min-h-[360px] flex-col justify-between overflow-hidden p-7 sm:p-10 lg:min-h-0 lg:p-12">
          <div className="relative z-10 flex items-center gap-3 text-white">
            <Mark />
            <span className="text-[36px] font-black tracking-[-0.06em]">TenantSea</span>
          </div>

          <div className="relative z-10 max-w-[760px] pb-4 lg:pb-12">
            <p className="text-[15px] font-black uppercase tracking-[0.2em] text-[#d6ff6d]">{eyebrow ?? "Rental, made clear"}</p>
            <h1
              className={cn(
                "mt-5 max-w-[760px] text-[3.4rem] font-black leading-[0.86] tracking-[-0.075em] text-white sm:text-[4.8rem] lg:text-[7rem]",
                titleClassName,
              )}
            >
              {title}
            </h1>
            {description ? (
              <p className={cn("mt-7 max-w-[690px] text-[1.1rem] leading-[1.15] text-white/80 sm:text-[2.1rem]", descriptionClassName)}>
                {description}
              </p>
            ) : null}
          </div>

          <div className="relative z-10 flex items-center gap-3 text-xs text-white/70">
            <span className="inline-flex items-center gap-4 rounded-full border border-white/20 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a1414] text-[22px] font-black text-white">
                N
              </span>
              <span className="inline-flex items-center gap-2 text-[18px] font-medium text-white/90">
                <span className="h-2.5 w-2.5 rounded-full bg-[#d6ff6d]" />
                Trust-first renting
              </span>
            </span>
          </div>

          <div className="auth-pitch-shape auth-pitch-shape-one" />
          <div className="auth-pitch-shape auth-pitch-shape-two" />
        </section>

        <section className="auth-form flex flex-col justify-center bg-[#eef3ee] p-6 sm:p-10 lg:p-12">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-xs font-semibold text-teal hover:underline">Back to home</Link>
          </div>
          <div className="mx-auto w-full max-w-md rounded-[18px] bg-white p-6 shadow-[0_18px_50px_rgba(0,75,73,0.06)] sm:p-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}