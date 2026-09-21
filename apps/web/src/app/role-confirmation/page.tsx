"use client";

import * as React from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default function RoleConfirmationPage() {
  const [role, setRole] = React.useState("Tenant");
  return (
    <AuthShell variant="centered" eyebrow="Role confirmation" title={`Continue as ${role}?`} description="Choose the account type you want to use for this session.">
      <div className="grid gap-2">
        {["Tenant", "Landlord", "Letting agent"].map((item) => (
          <button key={item} type="button" onClick={() => setRole(item)} className={`flex items-center justify-between rounded-[8px] border px-4 py-3 text-left text-sm ${role === item ? "border-[#004b49] bg-[#efffee]" : "border-[#d9efd9]"}`}>
            <span>{item}</span><span className={`h-4 w-4 rounded-full border ${role === item ? "border-[#004b49] bg-[#baff00]" : "border-[#b8c9c3]"}`} />
          </button>
        ))}
      </div>
      <Button className="mt-5 w-full">Continue</Button>
      <Link href="/login" className="mt-4 block text-center text-xs text-[#71817e] hover:text-[#004b49]">Use another account</Link>
    </AuthShell>
  );
}
