import { apiClient } from "./client";

export type MentorPaymentPolicy = {
  id: number;
  internship_policy_id: number;
  amount: string;
};

export type InternshipPolicy = {
  id: number;
  position_id: number;

  effective_from: string;
  effective_to: string | null;

  duration_min_days: number;
  duration_max_days: number;

  probation_months: number;

  mentor_payment_policy:
    | MentorPaymentPolicy
    | null;
};

export type InternshipPolicyCreate = {
  position_id: number;

  effective_from: string;
  effective_to: string | null;

  duration_min_days: number;
  duration_max_days: number;

  probation_months: number;

  mentor_payment_amount: string;
};

export type InternshipPolicyUpdate =
  Partial<InternshipPolicyCreate>;

export type InternshipPolicyFilters = {
  positionId?: number;
};

export function getInternshipPolicies(
  filters: InternshipPolicyFilters = {},
): Promise<InternshipPolicy[]> {
  const searchParams =
    new URLSearchParams();

  if (filters.positionId !== undefined) {
    searchParams.set(
      "position_id",
      String(filters.positionId),
    );
  }

  const queryString =
    searchParams.toString();

  const path = queryString
    ? `/internship-policies?${queryString}`
    : "/internship-policies";

  return apiClient<InternshipPolicy[]>(
    path,
    {
      auth: true,
    },
  );
}

export function getInternshipPolicy(
  policyId: number,
): Promise<InternshipPolicy> {
  return apiClient<InternshipPolicy>(
    `/internship-policies/${policyId}`,
    {
      auth: true,
    },
  );
}

export function createInternshipPolicy(
  data: InternshipPolicyCreate,
): Promise<InternshipPolicy> {
  return apiClient<InternshipPolicy>(
    "/internship-policies",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function updateInternshipPolicy(
  policyId: number,
  data: InternshipPolicyUpdate,
): Promise<InternshipPolicy> {
  return apiClient<InternshipPolicy>(
    `/internship-policies/${policyId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function deleteInternshipPolicy(
  policyId: number,
): Promise<void> {
  return apiClient<void>(
    `/internship-policies/${policyId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}