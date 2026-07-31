"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AuthHeaderNav({
  tenantId,
  isLoggedIn,
}: {
  tenantId: string;
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();

  if (isLoggedIn) {
    return (
      <Link href={`/t/${tenantId}/app`} className="hover:text-foreground">
        Open dashboard
      </Link>
    );
  }

  if (pathname.endsWith("/register")) {
    return (
      <Link href="/login" className="hover:text-foreground">
        Sign in
      </Link>
    );
  }

  if (pathname.endsWith("/login") || pathname.endsWith("/forgot-password")) {
    return (
      <Link href="/register" className="hover:text-foreground">
        Sign up
      </Link>
    );
  }

  return (
    <Link href="/login" className="hover:text-foreground">
      Sign in
    </Link>
  );
}
