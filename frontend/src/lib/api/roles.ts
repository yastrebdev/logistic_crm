import { apiClient } from "./client";

export type Permission = {
  id: number;
  name: string;
};

export type Role = {
  id: number;
  name: string;
  permissions: Permission[];
};

export type UpdateRoleRequest = {
  permission_ids: number[];
};

export function getRoles(): Promise<Role[]> {
  return apiClient<Role[]>("/roles", {
    auth: true,
  });
}

export function updateRole(
  roleId: number,
  data: UpdateRoleRequest,
): Promise<Role> {
  return apiClient<Role>(
    `/roles/${roleId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function getPermissions(): Promise<Permission[]> {
  return apiClient<Permission[]>(
    "/roles/permissions",
    {
      auth: true,
    },
  );
}