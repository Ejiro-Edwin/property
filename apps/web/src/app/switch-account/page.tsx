"use client";

import * as React from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

const accounts = [
  { name: "Thelinx Properties", role: "Landlord", active: true },
  { name: "Thelinx Apartments", role: "Letting agent", active: false },
  { name: "Oak House", role: "Tenant", active: false },
];

export default function SwitchAccountPage() {
  const [selected, setSelected] = React.useState(accounts[0].name);
  return (
    <AuthShell variant="centered" eyebrow="Switch account" title="Choose an account" description="Select which workspace you want to continue to.">
      <div className="grid gap-2">
        {accounts.map((account) => (
          <button key={account.name} type="button" onClick={() => setSelected(account.name)} className={`flex items-center gap-3 rounded-[8px] border p-3 text-left ${selected === account.name ? "border-[#004b49] bg-[#efffee]" : "border-[#d9efd9]"}`}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5f4fb] text-[#1399d8]">{account.name.charAt(0)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#0f172a]">{account.name}</span><span className="block text-xs text-[#71817e]">{account.role}</span></span>
            <span className={`h-4 w-4 rounded-full border ${selected === account.name ? "border-[#004b49] bg-[#baff00]" : "border-[#b8c9c3]"}`} />
          </button>
        ))}
      </div>
      <Button className="mt-5 w-full">Continue</Button>
      <Link href="/login" className="mt-4 block text-center text-xs text-[#71817e] hover:text-[#004b49]">Sign in with another email</Link>
    </AuthShell>
  );
}
