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
      <div className="auth-frame mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-[1480px] overflow-hidden sm:min-h-[calc(100dvh-3rem)] lg:grid-cols-[1.4fr_0.9fr]">
        <section className="auth-pitch relative flex min-h-[360px] flex-col justify-between overflow-hidden p-7 sm:p-10 lg:min-h-0 lg:p-14">
          <div className="relative z-10 flex items-center gap-3 text-white">
            <Mark />
            <span className="text-[32px] font-black tracking-[-0.06em]">TenantSea</span>
          </div>

          <div className="relative z-10 max-w-[760px] pb-4 lg:pb-12">
            <p className="text-[15px] font-black uppercase tracking-[0.18em] text-[#d7ff7a]">{eyebrow ?? "Rental, made clear"}</p>
            <h1
              className={cn(
                "mt-5 max-w-[760px] text-[3.2rem] font-black leading-[0.9] tracking-[-0.06em] text-white sm:text-[4.3rem] lg:text-[6.1rem]",
                titleClassName,
              )}
            >
              {title}
            </h1>
            {description ? (
              <p className={cn("mt-6 max-w-[690px] text-xl leading-[1.25] text-white/80 sm:text-[2.2rem] sm:leading-[1.12]", descriptionClassName)}>
                {description}
              </p>
            ) : null}
          </div>

          <div className="relative z-10 flex items-center gap-3 text-xs text-white/70">
            <span className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-3 py-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0a1414] text-[15px] font-black text-white">
                N
              </span>
              <span className="inline-flex items-center gap-2 text-[15px] font-medium text-white/90">
                <span className="h-2.5 w-2.5 rounded-full bg-[#d7ff7a]" />
                Trust-first renting
              </span>
            </span>
          </div>

          <div className="auth-pitch-shape auth-pitch-shape-one" />
          <div className="auth-pitch-shape auth-pitch-shape-two" />
        </section>

        <section className="auth-form flex flex-col justify-center bg-[#f2f7f3] p-6 sm:p-10 lg:p-12">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="text-xs font-semibold text-teal hover:underline">Back to home</Link>
          </div>
          <div className="mx-auto w-full max-w-md rounded-[24px] bg-white p-6 shadow-[0_18px_50px_rgba(0,75,73,0.06)] sm:p-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}