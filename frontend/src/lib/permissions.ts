export function hasPermission(
  permissions: string[],
  permission: string,
): boolean {
  return permissions.includes(permission);
}