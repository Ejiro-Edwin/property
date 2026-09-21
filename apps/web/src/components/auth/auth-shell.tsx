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
  variant = "split",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
  variant?: "split" | "centered";
}) {
  if (variant === "centered") {
    return (
      <main className="auth-page flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
        <section className="w-full max-w-[390px] rounded-[8px] border border-[#d9efd9] bg-white p-6 shadow-[0_14px_40px_rgba(0,75,73,0.08)] sm:p-8">
          <div className="mb-7 flex items-center justify-center">
            <Mark className="h-7 w-7 text-[#004b49]" />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#52706d]">{eyebrow ?? "TenantSea"}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-[#004b49]">{title}</h1>
            {description ? <p className="mt-2 text-sm leading-6 text-[#6c7977]">{description}</p> : null}
          </div>
          <div className="mt-7">{children}</div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page min-h-dvh px-4 py-4 sm:px-8 sm:py-6">
      <div className="auth-frame mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-[1480px] overflow-hidden rounded-[4px] bg-[#efffee] sm:min-h-[calc(100dvh-3rem)] lg:grid-cols-[1fr_0.84fr]">
        <section className="auth-pitch relative flex min-h-[340px] flex-col justify-between overflow-hidden bg-[#efffee] p-7 sm:p-10 lg:min-h-0 lg:p-14">
          <div className="relative z-10 flex items-center gap-2 text-[#004b49]">
            <Mark className="h-7 w-7" />
            <span className="text-sm font-bold tracking-[-0.03em]">TenantSea</span>
          </div>

          <div className="relative z-10 max-w-[470px] pb-4 lg:pb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#004b49]">{eyebrow ?? "Rental, made clear"}</p>
            <h1
              className={cn(
                "mt-4 max-w-[470px] text-[2.8rem] font-black leading-[0.9] tracking-[-0.065em] text-[#004b49] sm:text-[4rem] lg:text-[5.2rem]",
                titleClassName,
              )}
            >
              {title}
            </h1>
            {description ? (
              <p className={cn("mt-5 max-w-[390px] text-base leading-6 text-[#52706d] sm:text-lg", descriptionClassName)}>
                {description}
              </p>
            ) : null}
          </div>

          <div className="relative z-10 text-xs text-[#52706d]">Trust-first renting</div>
          <div className="auth-pitch-shape auth-pitch-shape-one" />
          <div className="auth-pitch-shape auth-pitch-shape-two" />
          <div className="auth-pitch-shape auth-pitch-shape-three" />
        </section>

        <section className="auth-form flex flex-col justify-center border-l border-[#d9efd9] bg-white p-6 sm:p-10 lg:p-16">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/" className="text-xs font-semibold text-[#004b49] hover:underline">Back to home</Link>
            <Mark className="h-6 w-6 text-[#004b49]" />
          </div>
          <div className="mx-auto w-full max-w-[360px]">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}