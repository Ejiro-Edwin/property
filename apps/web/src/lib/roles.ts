export function isTenantRole(role?: string | null) {
  return (role ?? "").toLowerCase() === "tenant";
}

export function isPrivilegedRole(role?: string | null) {
  const r = (role ?? "").toLowerCase();
  return r === "landlord" || r === "letting_agent" || r === "admin";
}

export const landlordNav = [
  { href: "app", label: "Overview", exact: true },
  { href: "app/properties", label: "Properties" },
  { href: "app/tenancies", label: "Tenancies" },
  { href: "app/people", label: "People" },
  { href: "app/payments", label: "Payments" },
  { href: "app/trust", label: "Trust" },
  { href: "app/notifications", label: "Notifications" },
  { href: "app/profile", label: "Profile" },
  { href: "app/audit", label: "Audit", adminOnly: true },
] as const;

export const tenantNav = [
  { href: "app", label: "Home", exact: true },
  { href: "app/my-tenancy", label: "My tenancy" },
  { href: "app/payments", label: "My payments" },
  { href: "app/my-trust", label: "Trust score" },
  { href: "app/notifications", label: "Notifications" },
  { href: "app/profile", label: "Profile" },
] as const;
