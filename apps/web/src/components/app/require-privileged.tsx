"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isTenantRole } from "@/lib/roles";
import { Skeleton } from "@/components/ui/skeleton";

export function RequirePrivileged({
  children,
  redirectTo = "app",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const router = useRouter();
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;
  const [allowed, setAllowed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    api<{ user: { role?: string } }>("auth/me", { tenantId })
      .then((r) => {
        if (isTenantRole(r.user?.role)) {
          router.replace(`/t/${tenantId}/${redirectTo}`);
        } else {
          setAllowed(true);
        }
      })
      .catch(() => router.replace(`/t/${tenantId}/${redirectTo}`));
  }, [tenantId, router, redirectTo]);

  if (allowed === null) {
    return <Skeleton className="h-[320px]" />;
  }

  return <>{children}</>;
}
