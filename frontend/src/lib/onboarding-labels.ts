import type {
  AdmissionFormat,
  MentorAssignmentStatus,
  NonPaymentReason,
  PaymentStatus,
} from "@/lib/api/introductory-processes";

export const admissionFormatLabels: Record<
  AdmissionFormat,
  string
> = {
  "The test is on the form":
    "Тестирование на бланке",
  "The test on the portal":
    "Тестирование на портале",
  Exam: "Экзамен",
  Interview: "Собеседование",
};

export const admissionFormatOptions = (
  Object.entries(admissionFormatLabels) as Array<
    [AdmissionFormat, string]
  >
).map(([value, label]) => ({
  value,
  label,
}));

export const mentorAssignmentStatusLabels: Record<
  MentorAssignmentStatus,
  string
> = {
  "Previously employed": "Работал ранее",
  "MPO is the mentor": "МПО — наставник",
  "Mentor is not required":
    "Наставник не предполагается",
  "Mentor is assigned":
    "Наставник назначен",
};

export const mentorAssignmentStatusOptions = (
  Object.entries(
    mentorAssignmentStatusLabels,
  ) as Array<
    [MentorAssignmentStatus, string]
  >
).map(([value, label]) => ({
  value,
  label,
}));

export const paymentStatusLabels: Record<
  PaymentStatus,
  string
> = {
  Pending: "Ожидает обработки",
  Approved: "Одобрена",
  Paid: "Выплачена",
  Cancelled: "Отменена",
};

export const paymentStatusOptions = (
  Object.entries(paymentStatusLabels) as Array<
    [PaymentStatus, string]
  >
).map(([value, label]) => ({
  value,
  label,
}));

export const paymentStatusColors: Record<
  PaymentStatus,
  string
> = {
  Pending: "processing",
  Approved: "warning",
  Paid: "success",
  Cancelled: "error",
};

export const nonPaymentReasonLabels: Record<
  NonPaymentReason,
  string
> = {
  "Internship not completed":
    "Стажировка не завершена",
  "Insufficient internship duration":
    "Недостаточная продолжительность стажировки",
  "Mentor is not eligible for payment":
    "Наставник не имеет права на выплату",
  "Employee left before completion":
    "Сотрудник уволился до завершения",
  "Mentor left before completion":
    "Наставник уволился до завершения",
  "Duplicate payment":
    "Дублирующая выплата",
  "Payment already processed":
    "Выплата уже обработана",
  "Incorrect data": "Некорректные данные",
  "Management decision":
    "Решение руководства",
  Other: "Другое",
};

export const nonPaymentReasonOptions = (
  Object.entries(
    nonPaymentReasonLabels,
  ) as Array<
    [NonPaymentReason, string]
  >
).map(([value, label]) => ({
  value,
  label,
}));