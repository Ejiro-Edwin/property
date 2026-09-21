import Link from "next/link";
import { Mark } from "@/components/brand/mark";

const benefits = [
  ["▣", "Manage properties"],
  ["▰", "Track payments"],
  ["✣", "Build trusted rental history"],
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#efffee] p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-[1180px] overflow-hidden rounded-[4px] border border-[#d9efd9] bg-white shadow-[0_18px_50px_rgba(0,75,73,0.08)] sm:min-h-[calc(100dvh-4rem)] lg:grid-cols-2">
        <section className="relative overflow-hidden bg-[#efffee] px-8 py-9 sm:px-12 sm:py-12">
          <div className="relative z-10 flex items-center gap-2 text-[#004b49]">
            <Mark className="h-7 w-7" />
            <span className="text-xs font-bold tracking-[-0.02em]">TenantSea</span>
          </div>

          <div className="relative z-10 mt-24 max-w-[360px] sm:mt-32">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#52706d]">— Property platform</p>
            <h1 className="mt-16 text-[2.3rem] font-black leading-[0.9] tracking-[-0.065em] text-[#004b49] sm:text-[3.2rem]">
              Everything you need for a better rental experience.
            </h1>
            <p className="mt-4 max-w-[300px] text-[11px] leading-4 text-[#52706d]">
              TenantSea connects tenants, landlords and agents to manage properties, payments and trusted rental relationships in one place.
            </p>
            <div className="mt-6 grid gap-2">
              {benefits.map(([icon, label]) => (
                <div key={label} className="flex items-center gap-2 text-[10px] font-semibold text-[#004b49]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#baff00] text-[11px]">{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-[#cfff62]" />
          <div className="absolute right-[-58px] top-[31%] h-44 w-44 rounded-full bg-[#c2dbd2]" />
          <div className="absolute bottom-[16%] left-[25%] h-44 w-44 rounded-full bg-[#cfff62]/80" />
          <div className="absolute bottom-[-50px] left-[40%] h-48 w-48 rounded-full bg-[#c2dbd2]/80" />
          <div className="absolute left-[10%] top-[26%] h-36 w-24 border border-[#b8d8c8] opacity-70" />
          <div className="absolute right-[12%] bottom-[24%] h-32 w-28 border border-[#b8d8c8] opacity-70" />
        </section>

        <section className="flex items-center justify-center bg-white px-8 py-12 sm:px-16">
          <div className="w-full max-w-[360px] text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-[#004b49]"><Mark className="h-4 w-4" /> TenantSea</div>
            <h2 className="mt-6 text-[1.45rem] font-semibold tracking-[-0.045em] text-[#004b49]">Welcome to TenantSea</h2>
            <p className="mt-2 text-[10px] text-[#82908d]">Your property journey, connected.</p>
            <div className="mt-8 grid gap-3">
              <Link href="/register" className="flex h-10 items-center justify-center rounded-[7px] bg-[#baff00] text-[11px] font-bold text-[#004b49] hover:bg-[#a9eb00]">Create an account →</Link>
              <Link href="/login" className="flex h-10 items-center justify-center rounded-[7px] border border-[#004b49] text-[11px] font-semibold text-[#004b49] hover:bg-[#efffee]">Sign in</Link>
              <div className="flex items-center gap-3 text-[9px] text-[#a2aaa7]"><span className="h-px flex-1 bg-[#edf0ed]" />OR<span className="h-px flex-1 bg-[#edf0ed]" /></div>
              <button type="button" className="flex h-10 items-center justify-center gap-2 rounded-[7px] border border-[#e4e8e5] text-[10px] font-semibold text-[#52605c] hover:bg-[#f8faf8]"><span className="font-bold text-[#4285f4]">G</span> Continue with Google</button>
            </div>
            <p className="mx-auto mt-8 max-w-[230px] text-[8px] leading-3 text-[#9ba6a2]">By continuing, you agree to TenantSea&apos;s <span className="underline">Terms of Service</span> and <span className="underline">Privacy Policy</span>.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
