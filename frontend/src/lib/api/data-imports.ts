import { apiClient } from "./client";


export type ImportType =
  | "onboarding_history";

export type ImportStatus =
  | "validating"
  | "ready"
  | "importing"
  | "completed"
  | "failed";

export type ImportRowStatus =
  | "valid"
  | "warning"
  | "error"
  | "imported"
  | "skipped";


export type ImportJob = {
  id: number;
  import_type: ImportType;
  status: ImportStatus;

  filename: string;
  sheet_name: string;

  created_by_user_id: number | null;

  total_rows: number;
  valid_rows: number;
  warning_rows: number;
  error_rows: number;
  imported_rows: number;

  error_message: string | null;

  created_at: string;
  completed_at: string | null;
};


export type ImportJobRow = {
  id: number;
  import_job_id: number;

  excel_row_number: number;
  source_row_id: string | null;

  status: ImportRowStatus;

  raw_data: Record<string, unknown>;

  normalized_data:
    | Record<string, unknown>
    | null;

  warnings: string[];
  errors: string[];

  result_data:
    | Record<string, unknown>
    | null;
};


export type ImportJobRowList = {
  items: ImportJobRow[];
  total: number;
  page: number;
  page_size: number;
};


export function createOnboardingImportPreview(
  file: File,
): Promise<ImportJob> {
  const formData = new FormData();

  formData.append("file", file);

  return apiClient<ImportJob>(
    "/imports/onboarding/preview",
    {
      method: "POST",
      body: formData,
      auth: true,
    },
  );
}


export function getImportJob(
  importJobId: number,
): Promise<ImportJob> {
  return apiClient<ImportJob>(
    `/imports/${importJobId}`,
    {
      auth: true,
    },
  );
}


export function getImportJobRows({
  importJobId,
  page = 1,
  pageSize = 50,
  status,
}: {
  importJobId: number;
  page?: number;
  pageSize?: number;
  status?: ImportRowStatus;
}): Promise<ImportJobRowList> {
  const searchParams =
    new URLSearchParams();

  searchParams.set(
    "page",
    String(page),
  );

  searchParams.set(
    "page_size",
    String(pageSize),
  );

  if (status) {
    searchParams.set(
      "status",
      status,
    );
  }

  return apiClient<ImportJobRowList>(
    (
      `/imports/${importJobId}/rows?` +
      searchParams.toString()
    ),
    {
      auth: true,
    },
  );
}

export function executeOnboardingImport(
  importJobId: number,
): Promise<ImportJob> {
  return apiClient<ImportJob>(
    `/imports/${importJobId}/execute`,
    {
      method: "POST",
      auth: true,
    },
  );
}