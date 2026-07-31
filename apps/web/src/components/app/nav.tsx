"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
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

const items = [
  { href: "app", label: "Overview", icon: IconHome, exact: true },
  { href: "app/properties", label: "Properties", icon: IconBuilding },
  { href: "app/tenancies", label: "Tenancies", icon: IconKey },
  { href: "app/people", label: "People", icon: IconUsers },
  { href: "app/payments", label: "Payments", icon: IconCard },
  { href: "app/trust", label: "Trust", icon: IconShield },
  { href: "app/notifications", label: "Notifications", icon: IconBell },
  { href: "app/profile", label: "Profile", icon: IconUser },
  { href: "app/audit", label: "Audit", icon: IconScroll, adminOnly: true },
];

export function AppNav({
  tenantId,
  showAudit = false,
}: {
  tenantId: string;
  showAudit?: boolean;
}) {
  const pathname = usePathname();

  const visible = items.filter((item) => !item.adminOnly || showAudit);

  return (
    <nav className="grid gap-1">
      {visible.map((item) => {
        const href = `/t/${tenantId}/${item.href}`;
        const active = item.exact
          ? pathname === href
          : pathname.startsWith(href);
        const Icon = item.icon;
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
