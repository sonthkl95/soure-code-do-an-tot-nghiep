export function hasAny(user: any, perms?: string[]) {
  if (!perms || perms.length === 0) return true;
  const set = new Set(user?.permissions ?? []);
  return perms.some((p) => set.has(p));
}

export function hasAll(user: any, perms?: string[]) {
  if (!perms || perms.length === 0) return true;
  const set = new Set(user?.permissions ?? []);
  return perms.every((p) => set.has(p));
}

export function hasRole(user: any, roles?: string[]) {
  if (!roles || roles.length === 0) return true;
  const set = new Set(user?.roles ?? []);
  return roles.some((r) => set.has(r));
}
