export function isTenantRole(role?: string | null) {
  return (role ?? "").toLowerCase() === "tenant";
}

export function isPrivilegedRole(role?: string | null) {
  const r = (role ?? "").toLowerCase();
  return r === "landlord" || r === "letting_agent" || r === "admin";
}

export function profileLabel(role: string): string {
  switch (role.toLowerCase()) {
    case "landlord":
      return "Landlord";
    case "tenant":
      return "Tenant";
    case "letting_agent":
      return "Agent";
    case "admin":
      return "Admin";
    default:
      return role;
  }
}

/** Operating profiles that share the portfolio/management UI (not tenant portal). */
export function isManagementProfile(role?: string | null) {
  return isPrivilegedRole(role);
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
