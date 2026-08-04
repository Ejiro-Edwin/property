export function isTenantRole(role?: string): boolean {
  return (role ?? '').toUpperCase() === 'TENANT';
}

export function isPrivilegedRole(role?: string): boolean {
  const r = (role ?? '').toUpperCase();
  return r === 'LANDLORD' || r === 'LETTING_AGENT' || r === 'ADMIN';
}

export type ActorContext = { id: string; role: string };
