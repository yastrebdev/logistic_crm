import type {
  AdaptationProcessStatus,
  AdaptationStage,
} from "./adaptations";
import {
    apiClient,
    apiDownload
} from "./client";
import type {
  CandidateType,
  HiringDelayReason,
  HiringRejectionReason,
  SeparationReason,
} from "./employees";
import type {
  AdmissionFormat,
  MentorAssignmentStatus,
  NonPaymentReason,
  PaymentStatus,
} from "./introductory-processes";
import type {
  PositionCategory,
} from "./organization";


export type OnboardingAnalyticsRow = {
  introductory_process_id: number;
  employee_id: number;

  distribution_center_id: number | null;
  distribution_center_code: string | null;
  distribution_center_name: string | null;

  distribution_center_division_id:
    | number
    | null;

  division_id: number | null;
  division_name: string | null;

  division_group_id: number | null;
  division_group_name: string | null;
  division_group_abbreviation:
    | string
    | null;

  manager_id: number | null;
  manager_name: string | null;

  personnel_number: string | null;
  employee_name: string;

  position_id: number | null;
  position_name: string | null;
  position_category:
    | PositionCategory
    | null;

  hire_date: string | null;

  reason_not_hiring:
    | HiringRejectionReason
    | null;

  reason_delayed_hiring:
    | HiringDelayReason
    | null;

  hiring_comment: string | null;
  candidate_type: CandidateType;

  introductory_start_date: string;
  introductory_end_date: string | null;

  tutor_id: number;
  tutor_name: string | null;
  tutor_email: string;

  introductory_internship_id:
    | number
    | null;

  introductory_internship_date:
    | string
    | null;

  introductory_mentor_id:
    | number
    | null;

  introductory_mentor_name:
    | string
    | null;

  training_id: number | null;
  training_date: string | null;

  admission_format:
    | AdmissionFormat
    | null;

  test_date: string | null;
  test_result: number | null;

  main_internship_id: number | null;

  main_internship_start_date:
    | string
    | null;

  main_internship_end_date:
    | string
    | null;

  internship_duration_min_days:
    | number
    | null;

  internship_duration_max_days:
    | number
    | null;

  actual_internship_duration_days:
    | number
    | null;

  internship_duration_compliant:
    | boolean
    | null;

  main_mentor_id: number | null;
  main_mentor_name: string | null;

  main_mentor_position_name:
    | string
    | null;

  mentor_assignment_status:
    | MentorAssignmentStatus
    | null;

  has_mentor: boolean;

  internship_form_completed:
    | boolean
    | null;

  mentor_payment_id: number | null;
  mentor_payment_expected: boolean;

  payment_due_date: string | null;

  planned_payment_amount:
    | string
    | null;

  actual_payment_amount:
    | string
    | null;

  payment_created_at: string | null;
  payment_paid_at: string | null;

  payment_status:
    | PaymentStatus
    | null;

  payment_is_fully_paid: boolean;

  non_payment_reason:
    | NonPaymentReason
    | null;

  payment_registration_method:
    | string
    | null;

  adaptation_process_id:
    | number
    | null;

  adaptation_status:
    | AdaptationProcessStatus
    | null;

  adaptation_deadline_date:
    | string
    | null;

  days_since_hire: number | null;

  adaptation_stage_1:
    | AdaptationStage
    | null;

  days_since_stage_1:
    | number
    | null;

  adaptation_stage_2:
    | AdaptationStage
    | null;

  adaptation_stage_3:
    | AdaptationStage
    | null;

  probation_completed_successfully:
    | boolean
    | null;

  separation_date: string | null;

  separation_reason:
    | SeparationReason
    | null;

  manager_separation_feedback:
    | string
    | null;
};


export type OnboardingAnalyticsResponse = {
  items: OnboardingAnalyticsRow[];
  total: number;
  page: number;
  page_size: number;
};


export type OnboardingAnalyticsFilters = {
  page?: number;
  pageSize?: number;

  distributionCenterId?: number;
  divisionGroupId?: number;
  divisionId?: number;
  positionId?: number;
  tutorId?: number;

  hireDateFrom?: string;
  hireDateTo?: string;

  employeeSearch?: string;
  overdueOnly?: boolean;
  hasRiskOnly?: boolean;
  paymentPendingOnly?: boolean;
};


export function getOnboardingAnalytics(
  filters: OnboardingAnalyticsFilters = {},
): Promise<OnboardingAnalyticsResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set(
    "page",
    String(filters.page ?? 1),
  );

  searchParams.set(
    "page_size",
    String(filters.pageSize ?? 20),
  );

  if (
    filters.distributionCenterId !==
    undefined
  ) {
    searchParams.set(
      "distribution_center_id",
      String(filters.distributionCenterId),
    );
  }

  if (
    filters.divisionGroupId !==
    undefined
  ) {
    searchParams.set(
      "division_group_id",
      String(filters.divisionGroupId),
    );
  }

  if (filters.divisionId !== undefined) {
    searchParams.set(
      "division_id",
      String(filters.divisionId),
    );
  }

  if (filters.positionId !== undefined) {
    searchParams.set(
      "position_id",
      String(filters.positionId),
    );
  }

  if (filters.tutorId !== undefined) {
    searchParams.set(
      "tutor_id",
      String(filters.tutorId),
    );
  }

  if (filters.hireDateFrom) {
    searchParams.set(
      "hire_date_from",
      filters.hireDateFrom,
    );
  }

  if (filters.hireDateTo) {
    searchParams.set(
      "hire_date_to",
      filters.hireDateTo,
    );
  }

  if (filters.employeeSearch) {
    searchParams.set(
      "employee_search",
      filters.employeeSearch,
    );
  }

  if (filters.overdueOnly) {
    searchParams.set(
      "overdue_only",
      "true",
    );
  }

  if (filters.hasRiskOnly) {
    searchParams.set(
      "has_risk_only",
      "true",
    );
  }

  if (filters.paymentPendingOnly) {
    searchParams.set(
      "payment_pending_only",
      "true",
    );
  }

  return apiClient<OnboardingAnalyticsResponse>(
    `/analytics/onboarding?${searchParams.toString()}`,
    {
      auth: true,
    },
  );
}

export async function exportOnboardingAnalytics(
  filters: OnboardingAnalyticsFilters = {},
): Promise<void> {
  const searchParams = new URLSearchParams();

  if (
    filters.distributionCenterId !==
    undefined
  ) {
    searchParams.set(
      "distribution_center_id",
      String(
        filters.distributionCenterId,
      ),
    );
  }

  if (
    filters.divisionGroupId !==
    undefined
  ) {
    searchParams.set(
      "division_group_id",
      String(filters.divisionGroupId),
    );
  }

  if (
    filters.divisionId !== undefined
  ) {
    searchParams.set(
      "division_id",
      String(filters.divisionId),
    );
  }

  if (
    filters.positionId !== undefined
  ) {
    searchParams.set(
      "position_id",
      String(filters.positionId),
    );
  }

  if (
    filters.tutorId !== undefined
  ) {
    searchParams.set(
      "tutor_id",
      String(filters.tutorId),
    );
  }

  if (filters.hireDateFrom) {
    searchParams.set(
      "hire_date_from",
      filters.hireDateFrom,
    );
  }

  if (filters.hireDateTo) {
    searchParams.set(
      "hire_date_to",
      filters.hireDateTo,
    );
  }

  if (filters.employeeSearch) {
    searchParams.set(
      "employee_search",
      filters.employeeSearch,
    );
  }

  if (filters.overdueOnly) {
    searchParams.set(
      "overdue_only",
      "true",
    );
  }

  if (filters.hasRiskOnly) {
    searchParams.set(
      "has_risk_only",
      "true",
    );
  }

  if (filters.paymentPendingOnly) {
    searchParams.set(
      "payment_pending_only",
      "true",
    );
  }

  const queryString =
    searchParams.toString();

  const path = queryString
    ? (
        "/analytics/onboarding/export" +
        `?${queryString}`
      )
    : "/analytics/onboarding/export";

  const file = await apiDownload(
    path,
    {
      auth: true,
    },
  );

  const downloadUrl =
    URL.createObjectURL(file.blob);

  const link =
    document.createElement("a");

  link.href = downloadUrl;
  link.download =
    file.filename ??
    "onboarding_report.xlsx";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(
    downloadUrl,
  );
}