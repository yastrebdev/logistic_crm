import { apiClient } from "./client";

export type CandidateType =
  | "former_employee"
  | "external_candidate";

export type HiringRejectionReason =
  | "candidate_refused"
  | "employer_refused"
  | "document_issues"
  | "medical_restrictions"
  | "failed_background_check"
  | "position_closed"
  | "no_contact"
  | "other";

export type HiringDelayReason =
  | "documents_pending"
  | "medical_exam_pending"
  | "background_check_pending"
  | "candidate_request"
  | "employer_request"
  | "start_date_postponed"
  | "other";

export type SeparationReason =
  | "voluntary_resignation"
  | "employer_termination"
  | "mutual_agreement"
  | "end_of_contract"
  | "transfer"
  | "retirement"
  | "job_abandonment"
  | "other";

export type Employee = {
  id: number;

  manager_id: number | null;
  distribution_center_division_id:
    | number
    | null;
  position_id: number | null;

  personnel_number: string | null;
  full_name: string;

  hire_date: string | null;
  reason_not_hiring:
    | HiringRejectionReason
    | null;
  reason_delayed_hiring:
    | HiringDelayReason
    | null;
  hiring_comment: string | null;

  separation_date: string | null;
  separation_reason: SeparationReason | null;
  manager_separation_feedback: string | null;

  candidate_type: CandidateType;
};

export type CreateEmployeeRequest = {
  manager_id?: number | null;
  distribution_center_division_id?:
    | number
    | null;
  position_id?: number | null;

  personnel_number?: string | null;
  full_name: string;

  hire_date?: string | null;
  reason_not_hiring?:
    | HiringRejectionReason
    | null;
  reason_delayed_hiring?:
    | HiringDelayReason
    | null;
  hiring_comment?: string | null;

  separation_date?: string | null;
  separation_reason?: SeparationReason | null;
  manager_separation_feedback?:
    | string
    | null;

  candidate_type: CandidateType;
};

export type UpdateEmployeeRequest = {
  manager_id?: number | null;
  distribution_center_division_id?:
    | number
    | null;
  position_id?: number | null;

  personnel_number?: string | null;

  hire_date?: string | null;
  reason_not_hiring?:
    | HiringRejectionReason
    | null;
  reason_delayed_hiring?:
    | HiringDelayReason
    | null;
  hiring_comment?: string | null;

  separation_date?: string | null;
  separation_reason?: SeparationReason | null;
  manager_separation_feedback?:
    | string
    | null;
};

export function getEmployees(): Promise<Employee[]> {
  return apiClient<Employee[]>("/employees", {
    auth: true,
  });
}

export function getEmployee(
  employeeId: number,
): Promise<Employee> {
  return apiClient<Employee>(
    `/employees/${employeeId}`,
    {
      auth: true,
    },
  );
}

export function createEmployee(
  data: CreateEmployeeRequest,
): Promise<Employee> {
  return apiClient<Employee>("/employees", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function updateEmployee(
  employeeId: number,
  data: UpdateEmployeeRequest,
): Promise<Employee> {
  return apiClient<Employee>(
    `/employees/${employeeId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}