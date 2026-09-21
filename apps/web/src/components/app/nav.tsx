"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isTenantRole } from "@/lib/roles";
import {
  IconBell,
  IconBuilding,
  IconCard,
  IconHome,
  IconKey,
  IconScroll,
  IconShield,
  IconUser,
  IconUsers,
} from "@/components/ui/icons";

const iconByHref: Record<string, React.ComponentType<{ width?: number; height?: number }>> = {
  app: IconHome,
  "app/properties": IconBuilding,
  "app/tenancies": IconKey,
  "app/my-tenancy": IconKey,
  "app/people": IconUsers,
  "app/payments": IconCard,
  "app/trust": IconShield,
  "app/my-trust": IconShield,
  "app/notifications": IconBell,
  "app/profile": IconUser,
  "app/audit": IconScroll,
  "app/documents": IconScroll,
  "app/messages": IconUsers,
  "app/maintenance": IconKey,
  "app/settings": IconUser,
};

const landlordItems = [
  { href: "app", label: "Dashboard", exact: true },
  { href: "app/properties", label: "Properties" },
  { href: "app/people", label: "Tenants" },
  { href: "app/tenancies", label: "Tenancies" },
  { href: "app/payments", label: "Payments" },
  { href: "app/maintenance", label: "Maintenance" },
  { href: "app/documents", label: "Documents" },
  { href: "app/messages", label: "Messages" },
  { href: "app/audit", label: "Trust / Activity" },
];

const tenantItems = [
  { href: "app", label: "Dashboard", exact: true },
  { href: "app/my-tenancy", label: "My tenancy" },
  { href: "app/payments", label: "Payments" },
  { href: "app/properties", label: "Property" },
  { href: "app/maintenance", label: "Maintenance" },
  { href: "app/documents", label: "Documents" },
  { href: "app/messages", label: "Messages" },
  { href: "app/my-trust", label: "Trust Profile" },
];

export function AppNav({
  tenantId,
  role,
  showAudit = false,
}: {
  tenantId: string;
  role?: string;
  showAudit?: boolean;
}) {
  const pathname = usePathname();
  const items = isTenantRole(role) ? tenantItems : landlordItems;
  const visible = items.filter((item) => !("adminOnly" in item) || !item.adminOnly || showAudit);

  return (
    <nav className="grid gap-1">
      {visible.map((item) => {
        const href = `/t/${tenantId}/${item.href}`;
        const active = item.exact ? pathname === href : pathname.startsWith(href);
        const Icon = iconByHref[item.href] ?? IconHome;
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-[8px] border border-transparent px-3 py-2 text-[13px] transition-all",
              active
                ? "bg-[#e2f3fb] font-medium text-[#1f1f1f]"
                : "text-[#2f2c2a] hover:bg-[#f4f1ed] hover:text-[#1f1f1f]",
            )}
          >
            <Icon width={17} height={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
