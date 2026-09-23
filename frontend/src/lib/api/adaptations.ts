import { apiClient } from "./client";
import type { PositionCategory } from "./organization";

/*
 * Enum-типы адаптации
 */

export type AdaptationProcessStatus =
  | "Active"
  | "Completed"
  | "Cancelled";

export type AdaptationStageStatus =
  | "upcoming"
  | "due"
  | "overdue"
  | "completed";

export type MethodExecutionAdaptation =
  | "in person"
  | "on portal"
  | "a phone call"
  | "yandex form";

export type AdaptationParticipants =
  | "MPO"
  | "MPO and MPP"
  | "MPO and supervisor"
  | "MPO, MPP and supervisor";

export type RiskZone =
  | "yellow"
  | "red";

export type AdaptationDelayReason =
  | "Employee absent"
  | "Supervisor absent"
  | "MPO absent"
  | "MPP absent"
  | "Schedule conflict"
  | "Technical issues"
  | "High workload"
  | "Adaptation rescheduled"
  | "Other";

export type AdaptationRiskReason =
  | "Low performance"
  | "Insufficient skills"
  | "Low motivation"
  | "Attendance issues"
  | "Disciplinary issues"
  | "Difficulties working with the team"
  | "Difficulties working with the supervisor"
  | "Failure to meet adaptation goals"
  | "Other";

/*
 * Справочник правил адаптации
 */

export type AdaptationPolicy = {
  id: number;
  effective_from: string;
  effective_to: string | null;
  position_category: PositionCategory;

  stage_1_start_offset_days: number;
  stage_1_duration_days: number;

  stage_2_red_offset_days: number;
  stage_2_normal_offset_days: number;
  stage_2_duration_days: number;

  stage_3_red_offset_days: number;
  stage_3_normal_offset_days: number;
  stage_3_duration_days: number;

  total_deadline_days: number;
};

export type AdaptationPolicyCreate = Omit<
  AdaptationPolicy,
  "id"
>;

export type AdaptationPolicyUpdate =
  Partial<AdaptationPolicyCreate>;

export type AdaptationPolicyFilters = {
  positionCategory?: PositionCategory;
};

/*
 * Этапы адаптации
 */

export type AdaptationStage = {
  id: number;
  adaptation_process_id: number;
  stage_number: 1 | 2 | 3;

  planned_start_date: string;
  planned_end_date: string;
  actual_date: string | null;

  method:
    | MethodExecutionAdaptation
    | null;

  participants:
    | AdaptationParticipants
    | null;

  delay_reason:
    | AdaptationDelayReason
    | null;

  zone: RiskZone | null;
  risk_zone: RiskZone | null;

  risk_reason:
    | AdaptationRiskReason
    | null;

  comment: string | null;

  delay_days: number;
  is_overdue: boolean;
  stage_status: AdaptationStageStatus;
};

export type AdaptationStageUpdate =
  Partial<{
    actual_date: string | null;

    method:
      | MethodExecutionAdaptation
      | null;

    participants:
      | AdaptationParticipants
      | null;

    delay_reason:
      | AdaptationDelayReason
      | null;

    risk_zone: RiskZone | null;

    risk_reason:
      | AdaptationRiskReason
      | null;

    comment: string | null;
  }>;

/*
 * Процесс адаптации
 */

export type AdaptationProcess = {
  id: number;
  introductory_process_id: number;
  policy_id: number;
  deadline_date: string;
  status: AdaptationProcessStatus;
  created_at: string;
  completed_at: string | null;
};

export type AdaptationProcessDetails =
  AdaptationProcess & {
    policy: AdaptationPolicy;
    stages: AdaptationStage[];
  };

export type AdaptationFilters = {
  introductoryProcessId?: number;
};

/*
 * API процессов адаптации
 */

export function getAdaptations(
  filters: AdaptationFilters = {},
): Promise<AdaptationProcess[]> {
  const searchParams = new URLSearchParams();

  if (
    filters.introductoryProcessId !==
    undefined
  ) {
    searchParams.set(
      "introductory_process_id",
      String(
        filters.introductoryProcessId,
      ),
    );
  }

  const queryString =
    searchParams.toString();

  const path = queryString
    ? `/adaptations?${queryString}`
    : "/adaptations";

  return apiClient<AdaptationProcess[]>(
    path,
    {
      auth: true,
    },
  );
}

export function getAdaptationDetails(
  adaptationProcessId: number,
): Promise<AdaptationProcessDetails> {
  return apiClient<AdaptationProcessDetails>(
    `/adaptations/${adaptationProcessId}`,
    {
      auth: true,
    },
  );
}

/*
 * API этапов адаптации
 */

export function getAdaptationStage(
  stageId: number,
): Promise<AdaptationStage> {
  return apiClient<AdaptationStage>(
    `/adaptations/stages/${stageId}`,
    {
      auth: true,
    },
  );
}

export function updateAdaptationStage(
  stageId: number,
  data: AdaptationStageUpdate,
): Promise<AdaptationStage> {
  return apiClient<AdaptationStage>(
    `/adaptations/stages/${stageId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

/*
 * API правил адаптации
 */

export function getAdaptationPolicies(
  filters: AdaptationPolicyFilters = {},
): Promise<AdaptationPolicy[]> {
  const searchParams = new URLSearchParams();

  if (
    filters.positionCategory !== undefined
  ) {
    searchParams.set(
      "position_category",
      filters.positionCategory,
    );
  }

  const queryString =
    searchParams.toString();

  const path = queryString
    ? `/adaptation-policies?${queryString}`
    : "/adaptation-policies";

  return apiClient<AdaptationPolicy[]>(
    path,
    {
      auth: true,
    },
  );
}

export function getAdaptationPolicy(
  policyId: number,
): Promise<AdaptationPolicy> {
  return apiClient<AdaptationPolicy>(
    `/adaptation-policies/${policyId}`,
    {
      auth: true,
    },
  );
}

export function createAdaptationPolicy(
  data: AdaptationPolicyCreate,
): Promise<AdaptationPolicy> {
  return apiClient<AdaptationPolicy>(
    "/adaptation-policies",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function updateAdaptationPolicy(
  policyId: number,
  data: AdaptationPolicyUpdate,
): Promise<AdaptationPolicy> {
  return apiClient<AdaptationPolicy>(
    `/adaptation-policies/${policyId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function deleteAdaptationPolicy(
  policyId: number,
): Promise<void> {
  return apiClient<void>(
    `/adaptation-policies/${policyId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}