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
  { href: "app", label: "Overview", exact: true },
  { href: "app/properties", label: "Properties" },
  { href: "app/tenancies", label: "Tenancies" },
  { href: "app/people", label: "People" },
  { href: "app/payments", label: "Payments" },
  { href: "app/trust", label: "Trust" },
  { href: "app/notifications", label: "Notifications" },
  { href: "app/profile", label: "Profile" },
  { href: "app/audit", label: "Audit", adminOnly: true },
  { href: "app/documents", label: "Documents" },
  { href: "app/messages", label: "Messages" },
  { href: "app/maintenance", label: "Maintenance" },
  { href: "app/settings", label: "Settings" },
];

const tenantItems = [
  { href: "app", label: "Home", exact: true },
  { href: "app/my-tenancy", label: "My tenancy" },
  { href: "app/payments", label: "My payments" },
  { href: "app/my-trust", label: "Trust score" },
  { href: "app/notifications", label: "Notifications" },
  { href: "app/profile", label: "Profile" },
  { href: "app/documents", label: "Documents" },
  { href: "app/messages", label: "Messages" },
  { href: "app/maintenance", label: "Maintenance" },
  { href: "app/settings", label: "Settings" },
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
              "flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm transition-colors",
              active
                ? "bg-brand-soft font-medium text-brand-ink"
                : "text-muted hover:bg-black/5 hover:text-foreground",
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
