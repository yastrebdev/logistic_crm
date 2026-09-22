import { apiClient } from "./client";

import type { DistributionCenter } from "./organization";

export type UserType =
  | "Training Manager"
  | "Lead Training Manager"
  | "Head of Department";

export const USER_TYPE_LABELS: Record<
  UserType,
  string
> = {
  "Training Manager": "Менеджер по обучению",
  "Lead Training Manager":
    "Ведущий менеджер по обучению",
  "Head of Department": "Руководитель отдела",
};

export const USER_TYPE_OPTIONS = (
  Object.entries(USER_TYPE_LABELS) as Array<
    [UserType, string]
  >
).map(([value, label]) => ({
  value,
  label,
}));

export type UserRole = {
  id: number;
  name: string;
};

export type User = {
  id: number;
  manager_id: number | null;
  email: string;
  full_name: string | null;
  is_active: boolean;
  user_type: UserType;
  role: UserRole;
  created_at: string;
};

export type CurrentUser = {
  id: number;
  manager_id: number | null;
  email: string;
  is_active: boolean;
  user_type: UserType;
  role: UserRole;
  permissions: string[];
  distribution_centers: DistributionCenter[];
  created_at: string;
};

export type UserListResponse = {
  items: User[];
  total: number;
  page: number;
  page_size: number;
};

export type CreateUserRequest = {
  email: string;
  password: string;
  role_id: number;
  manager_id?: number | null;
  user_type: UserType;
};

export type UpdateUserRequest = {
  role_id?: number;
  manager_id?: number | null;
  user_type?: UserType;
  is_active?: boolean;
};

export type UserDistributionCenter = {
  id: number;
  user_id: number;
  distribution_center_id: number;
  distribution_center: DistributionCenter;
};

export type AssignUserDistributionCenterRequest = {
  distribution_center_id: number;
};

export function getUsers(
  page = 1,
  pageSize = 20,
): Promise<UserListResponse> {
  return apiClient<UserListResponse>(
    `/users?page=${page}&page_size=${pageSize}`,
    {
      auth: true,
    },
  );
}

export function getMe(): Promise<CurrentUser> {
  return apiClient<CurrentUser>("/users/me", {
    auth: true,
  });
}

export function createUser(
  data: CreateUserRequest,
): Promise<User> {
  return apiClient<User>("/users", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function updateUser(
  userId: number,
  data: UpdateUserRequest,
): Promise<User> {
  return apiClient<User>(
    `/users/${userId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function getUserSubordinates(
  userId: number,
): Promise<User[]> {
  return apiClient<User[]>(
    `/users/${userId}/subordinates`,
    {
      auth: true,
    },
  );
}

export function getUserDistributionCenters(
  userId: number,
): Promise<UserDistributionCenter[]> {
  return apiClient<UserDistributionCenter[]>(
    `/users/${userId}/distribution-centers`,
    {
      auth: true,
    },
  );
}

export function assignUserDistributionCenter(
  userId: number,
  distributionCenterId: number,
): Promise<UserDistributionCenter> {
  const data: AssignUserDistributionCenterRequest = {
    distribution_center_id: distributionCenterId,
  };

  return apiClient<UserDistributionCenter>(
    `/users/${userId}/distribution-centers`,
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function removeUserDistributionCenter(
  userId: number,
  distributionCenterId: number,
): Promise<void> {
  return apiClient<void>(
    `/users/${userId}/distribution-centers/${distributionCenterId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

export async function getAllUsers(): Promise<
  User[]
> {
  const pageSize = 100;

  const firstPage = await getUsers(
    1,
    pageSize,
  );

  const pageCount = Math.ceil(
    firstPage.total / pageSize,
  );

  if (pageCount <= 1) {
    return firstPage.items;
  }

  const remainingPages = await Promise.all(
    Array.from(
      { length: pageCount - 1 },
      (_, index) =>
        getUsers(index + 2, pageSize),
    ),
  );

  return [
    ...firstPage.items,
    ...remainingPages.flatMap(
      (page) => page.items,
    ),
  ];
}