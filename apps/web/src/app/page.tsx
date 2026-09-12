import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";

const mockRows = [
  ["r", "s", "f", "si", "si", "t", "t", "a", "n", "s", "s"],
  ["p", "o", "p", "u", "l", "a", "t", "i", "o", "n"],
  ["u", "n", "i", "t", "s", "s", "p", "i", "e", "s"],
  ["l", "a", "n", "d", "l", "o", "r", "d", "s"],
];

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#0d0f12] text-white">
      <div className="mx-auto max-w-[1600px] px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#171b1e] shadow-[0_30px_80px_rgba(5,8,12,0.72)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_22%),linear-gradient(180deg,_rgba(17,19,21,0.88),_rgba(17,19,21,0.98))]" />

          <div className="relative z-10 px-4 pb-8 pt-5 sm:px-6 lg:px-8">
            <header className="flex items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-[#1d2125]/90 px-4 py-3 backdrop-blur-sm sm:px-5">
              <div className="flex items-center gap-3">
                <div className="rounded-[12px] border border-white/10 bg-white/5 p-1.5">
                  <Mark className="h-6 w-6 text-[#d9f8e4]" />
                </div>
                <span className="text-xl font-semibold tracking-[-0.04em] text-white">TenantSea</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] text-white/80">
                  A
                </div>
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-[#2a2e32] px-3 py-2 text-sm text-white/80 sm:flex">
                  <span className="font-medium">2%</span>
                  <span aria-hidden="true">▼</span>
                </div>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#2a2e32] text-lg text-white/80"
                  aria-label="Open dashboard"
                >
                  ▸
                </button>
                <Link
                  href="/register"
                  className="rounded-[12px] border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Share
                </Link>
              </div>
            </header>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[22px] border border-white/10 bg-[#13171a]/80 p-4 sm:p-5">
                <div className="flex gap-2 text-[10px] text-white/50">
                  {["[", ".", ".", "."].map((char, index) => (
                    <span key={`${char}-${index}`} className={index > 0 ? "opacity-60" : "opacity-100"}>
                      {char}
                    </span>
                  ))}
                </div>

                <div className="mt-5 space-y-5">
                  {mockRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2 overflow-hidden">
                      {row.map((cell, cellIndex) => (
                        <div
                          key={`${rowIndex}-${cellIndex}`}
                          className={
                            "h-7 rounded-[6px] border border-white/10 bg-white/5 px-2 text-[9px] uppercase tracking-[0.18em] text-white/40" +
                            (cellIndex % 3 === 0 ? " w-12" : " w-8")
                          }
                        >
                          {cell}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden lg:block" />
            </div>

            <div className="relative mt-8 rounded-[24px] border border-[#4d9eff]/60 bg-[#1c9cff] px-5 py-4 shadow-[0_22px_46px_rgba(28,156,255,0.45)] sm:px-7 sm:py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <h1 className="max-w-[540px] text-2xl font-semibold tracking-[-0.05em] text-white sm:text-3xl">
                  Sign up to comment, edit, inspect and more.
                </h1>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <Link href="/register">
                    <Button
                      variant="secondary"
                      className="h-12 rounded-[14px] border border-white/60 bg-white/10 px-5 text-base font-medium text-white shadow-none hover:bg-white/15"
                    >
                      Sign up
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="h-12 rounded-[14px] bg-[#f3f3f3] px-5 text-base font-semibold text-[#0b0d0f] shadow-none hover:bg-white">
                      Continue
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-[18px] border border-white/10 bg-[#0d1013]/15 px-2 py-3">
                {[
                  "cursor",
                  "square",
                  "grid",
                  "text",
                  "image",
                  "share",
                  "code",
                  "zoom",
                ].map((tool, index) => (
                  <div
                    key={tool}
                    className={
                      "flex h-12 w-12 items-center justify-center rounded-[10px] border border-white/15 bg-[#f5f5f5]/5 text-lg text-white/90" +
                      (index === 0 ? " bg-[#f5f5f5]/10" : "")
                    }
                  >
                    {tool === "cursor" ? "✦" : tool === "square" ? "◫" : tool === "grid" ? "▦" : tool === "text" ? "T" : tool === "image" ? "◌" : tool === "share" ? "↗" : tool === "code" ? "</>" : "⊕"}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#14181b]/95 px-4 py-5 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-6xl text-base leading-7 text-white/85">
            This website uses cookies, pixel tags, and local storage for performance, personalization, and marketing purposes. We use our own cookies and some from third parties. Only essential cookies are turned on by default. {" "}
            <span className="font-semibold text-[#7dd9ff]">Cookies settings</span>
          </p>

          <button type="button" className="h-9 w-9 rounded-full border border-white/10 bg-white/5 text-xl text-white/80" aria-label="Close cookie banner">
            ×
          </button>
        </div>

        <div className="mx-auto mt-4 flex max-w-[1600px] flex-col gap-3 sm:flex-row">
          <button type="button" className="flex-1 rounded-[14px] border border-white/10 bg-white/5 px-5 py-3 text-left text-base font-medium text-white/90 hover:bg-white/10">
            Do not allow cookies
          </button>
          <Link
            href="/register"
            className="flex-1 rounded-[14px] bg-[#1c9cff] px-5 py-3 text-center text-base font-medium text-white shadow-[0_18px_36px_rgba(28,156,255,0.35)] hover:bg-[#2aa7ff]"
          >
            Allow all cookies
          </Link>
        </div>
      </div>
    </main>
  );
}
