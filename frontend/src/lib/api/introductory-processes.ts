import { apiClient } from "./client";

/*
 * Родительский вводный процесс
 */

export type IntroductoryProcess = {
  id: number;
  employee_id: number;
  tutor_id: number;
  start_date: string;
  end_date: string | null;
};

export type IntroductoryProcessCreate = {
  employee_id: number;
  tutor_id: number;
  start_date?: string;
  end_date?: string | null;
};

export type IntroductoryProcessUpdate =
  Partial<{
    employee_id: number;
    tutor_id: number;
    start_date: string;
    end_date: string | null;
  }>;

export type IntroductoryProcessFilters = {
  employeeId?: number;
};

/*
 * Вводная стажировка
 */

export type IntroductoryInternship = {
  id: number;
  introductory_process_id: number;
  mentor_id: number;
  internship_date: string;
};

export type IntroductoryInternshipCreate = {
  introductory_process_id: number;
  mentor_id: number;
  internship_date: string;
};

export type IntroductoryInternshipUpdate =
  Partial<{
    introductory_process_id: number;
    mentor_id: number;
    internship_date: string;
  }>;

/*
 * Обучение и тестирование
 */

export type AdmissionFormat =
  | "The test is on the form"
  | "The test on the portal"
  | "Exam"
  | "Interview";

export type Training = {
  id: number;
  introductory_process_id: number;
  training_date: string | null;
  admission_format: AdmissionFormat;
  test_date: string | null;
  test_result: number | null;
};

export type TrainingCreate = {
  introductory_process_id: number;
  training_date?: string | null;
  admission_format: AdmissionFormat;
  test_date?: string | null;
  test_result?: number | null;
};

export type TrainingUpdate = Partial<{
  introductory_process_id: number;
  training_date: string | null;
  admission_format: AdmissionFormat;
  test_date: string | null;
  test_result: number | null;
}>;

/*
 * Основная стажировка
 */

export type MentorAssignmentStatus =
  | "Previously employed"
  | "MPO is the mentor"
  | "Mentor is not required"
  | "Mentor is assigned";

export type MainInternship = {
  id: number;
  introductory_process_id: number;
  mentor_id: number | null;
  mentor_assignment_status:
    MentorAssignmentStatus;
  start_date: string;
  end_date: string | null;
  actual_duration_days: number | null;
};

export type MainInternshipCreate = {
  introductory_process_id: number;
  mentor_id?: number | null;
  mentor_assignment_status:
    MentorAssignmentStatus;
  start_date: string;
  end_date?: string | null;
};

export type MainInternshipUpdate = Partial<{
  introductory_process_id: number;
  mentor_id: number | null;
  mentor_assignment_status:
    MentorAssignmentStatus;
  start_date: string;
  end_date: string | null;
}>;

/*
 * Выплата наставнику
 */

export type PaymentStatus =
  | "Pending"
  | "Approved"
  | "Paid"
  | "Cancelled";

export type NonPaymentReason =
  | "Internship not completed"
  | "Insufficient internship duration"
  | "Mentor is not eligible for payment"
  | "Employee left before completion"
  | "Mentor left before completion"
  | "Duplicate payment"
  | "Payment already processed"
  | "Incorrect data"
  | "Management decision"
  | "Other";

export type MentorPayment = {
  id: number;
  main_internship_id: number;
  internship_form_completed: boolean;
  payment_created_at: string | null;
  amount: string | null;
  payment_status: PaymentStatus;
  paid_at: string | null;
  non_payment_reason:
    | NonPaymentReason
    | null;
};

export type MentorPaymentCreate = {
  main_internship_id: number;
  internship_form_completed: boolean;
  payment_created_at?: string | null;
  amount?: string | null;
  payment_status?: PaymentStatus;
  paid_at?: string | null;
  non_payment_reason?:
    | NonPaymentReason
    | null;
};

export type MentorPaymentUpdate = Partial<{
  internship_form_completed: boolean;
  payment_created_at: string | null;
  amount: string | null;
  payment_status: PaymentStatus;
  paid_at: string | null;
  non_payment_reason:
    | NonPaymentReason
    | null;
}>;

/*
 * Детальный ответ вводного процесса
 */

export type MainInternshipDetails =
  MainInternship & {
    mentor_payment: MentorPayment | null;
  };

export type IntroductoryProcessDetails =
  IntroductoryProcess & {
    introductory_internships:
      IntroductoryInternship[];
    trainings: Training[];
    main_internships:
      MainInternshipDetails[];
  };

/*
 * API родительского процесса
 */

export function getIntroductoryProcesses(
  filters: IntroductoryProcessFilters = {},
): Promise<IntroductoryProcess[]> {
  const searchParams = new URLSearchParams();

  if (filters.employeeId !== undefined) {
    searchParams.set(
      "employee_id",
      String(filters.employeeId),
    );
  }

  const queryString = searchParams.toString();

  const path = queryString
    ? `/introductory-processes?${queryString}`
    : "/introductory-processes";

  return apiClient<IntroductoryProcess[]>(path, {
    auth: true,
  });
}

export function getIntroductoryProcess(
  processId: number,
): Promise<IntroductoryProcess> {
  return apiClient<IntroductoryProcess>(
    `/introductory-processes/${processId}`,
    {
      auth: true,
    },
  );
}

export function getIntroductoryProcessDetails(
  processId: number,
): Promise<IntroductoryProcessDetails> {
  return apiClient<IntroductoryProcessDetails>(
    `/introductory-processes/${processId}/details`,
    {
      auth: true,
    },
  );
}

export function createIntroductoryProcess(
  data: IntroductoryProcessCreate,
): Promise<IntroductoryProcess> {
  return apiClient<IntroductoryProcess>(
    "/introductory-processes",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function updateIntroductoryProcess(
  processId: number,
  data: IntroductoryProcessUpdate,
): Promise<IntroductoryProcess> {
  return apiClient<IntroductoryProcess>(
    `/introductory-processes/${processId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function deleteIntroductoryProcess(
  processId: number,
): Promise<void> {
  return apiClient<void>(
    `/introductory-processes/${processId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

/*
 * API вводных стажировок
 */

export function getIntroductoryInternships(
  processId?: number,
): Promise<IntroductoryInternship[]> {
  const query =
    processId === undefined
      ? ""
      : `?process_id=${processId}`;

  return apiClient<IntroductoryInternship[]>(
    `/introductory-internships${query}`,
    {
      auth: true,
    },
  );
}

export function getIntroductoryInternship(
  internshipId: number,
): Promise<IntroductoryInternship> {
  return apiClient<IntroductoryInternship>(
    `/introductory-internships/${internshipId}`,
    {
      auth: true,
    },
  );
}

export function createIntroductoryInternship(
  data: IntroductoryInternshipCreate,
): Promise<IntroductoryInternship> {
  return apiClient<IntroductoryInternship>(
    "/introductory-internships",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function updateIntroductoryInternship(
  internshipId: number,
  data: IntroductoryInternshipUpdate,
): Promise<IntroductoryInternship> {
  return apiClient<IntroductoryInternship>(
    `/introductory-internships/${internshipId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function deleteIntroductoryInternship(
  internshipId: number,
): Promise<void> {
  return apiClient<void>(
    `/introductory-internships/${internshipId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

/*
 * API обучений
 */

export function getTrainings(
  processId?: number,
): Promise<Training[]> {
  const query =
    processId === undefined
      ? ""
      : `?process_id=${processId}`;

  return apiClient<Training[]>(
    `/trainings${query}`,
    {
      auth: true,
    },
  );
}

export function getTraining(
  trainingId: number,
): Promise<Training> {
  return apiClient<Training>(
    `/trainings/${trainingId}`,
    {
      auth: true,
    },
  );
}

export function createTraining(
  data: TrainingCreate,
): Promise<Training> {
  return apiClient<Training>("/trainings", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
}

export function updateTraining(
  trainingId: number,
  data: TrainingUpdate,
): Promise<Training> {
  return apiClient<Training>(
    `/trainings/${trainingId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function deleteTraining(
  trainingId: number,
): Promise<void> {
  return apiClient<void>(
    `/trainings/${trainingId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

/*
 * API основных стажировок
 */

export function getMainInternships(
  processId?: number,
): Promise<MainInternship[]> {
  const query =
    processId === undefined
      ? ""
      : `?process_id=${processId}`;

  return apiClient<MainInternship[]>(
    `/main-internships${query}`,
    {
      auth: true,
    },
  );
}

export function getMainInternship(
  internshipId: number,
): Promise<MainInternship> {
  return apiClient<MainInternship>(
    `/main-internships/${internshipId}`,
    {
      auth: true,
    },
  );
}

export function createMainInternship(
  data: MainInternshipCreate,
): Promise<MainInternship> {
  return apiClient<MainInternship>(
    "/main-internships",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function updateMainInternship(
  internshipId: number,
  data: MainInternshipUpdate,
): Promise<MainInternship> {
  return apiClient<MainInternship>(
    `/main-internships/${internshipId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function deleteMainInternship(
  internshipId: number,
): Promise<void> {
  return apiClient<void>(
    `/main-internships/${internshipId}`,
    {
      method: "DELETE",
      auth: true,
    },
  );
}

/*
 * API выплат наставникам
 */

export function getMentorPayments(
  mainInternshipId?: number,
): Promise<MentorPayment[]> {
  const query =
    mainInternshipId === undefined
      ? ""
      : `?main_internship_id=${mainInternshipId}`;

  return apiClient<MentorPayment[]>(
    `/mentor-payments${query}`,
    {
      auth: true,
    },
  );
}

export function getMentorPayment(
  paymentId: number,
): Promise<MentorPayment> {
  return apiClient<MentorPayment>(
    `/mentor-payments/${paymentId}`,
    {
      auth: true,
    },
  );
}

export function createMentorPayment(
  data: MentorPaymentCreate,
): Promise<MentorPayment> {
  return apiClient<MentorPayment>(
    "/mentor-payments",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}

export function updateMentorPayment(
  paymentId: number,
  data: MentorPaymentUpdate,
): Promise<MentorPayment> {
  return apiClient<MentorPayment>(
    `/mentor-payments/${paymentId}`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}