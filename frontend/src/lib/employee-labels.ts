import type {
  CandidateType,
  HiringDelayReason,
  HiringRejectionReason,
  SeparationReason,
} from "./api/employees";

export const candidateTypeLabels: Record<
  CandidateType,
  string
> = {
  former_employee: "Бывший сотрудник",
  external_candidate: "Внешний кандидат",
};

export const hiringRejectionReasonLabels: Record<
  HiringRejectionReason,
  string
> = {
  candidate_refused: "Отказ кандидата",
  employer_refused: "Отказ работодателя",
  document_issues: "Проблемы с документами",
  medical_restrictions:
    "Медицинские ограничения",
  failed_background_check:
    "Не пройдена проверка",
  position_closed: "Вакансия закрыта",
  no_contact: "Нет связи с кандидатом",
  other: "Другое",
};

export const hiringDelayReasonLabels: Record<
  HiringDelayReason,
  string
> = {
  documents_pending: "Ожидание документов",
  medical_exam_pending:
    "Ожидание медосмотра",
  background_check_pending:
    "Ожидание проверки",
  candidate_request: "Просьба кандидата",
  employer_request: "Просьба работодателя",
  start_date_postponed:
    "Дата выхода перенесена",
  other: "Другое",
};

export const separationReasonLabels: Record<
  SeparationReason,
  string
> = {
  voluntary_resignation:
    "Увольнение по собственному желанию",
  employer_termination:
    "Увольнение по инициативе работодателя",
  mutual_agreement: "Соглашение сторон",
  end_of_contract: "Окончание договора",
  transfer: "Перевод",
  retirement: "Выход на пенсию",
  job_abandonment: "Невыход на работу",
  other: "Другое",
};

export const candidateTypeOptions = (
  Object.entries(candidateTypeLabels) as Array<
    [CandidateType, string]
  >
).map(([value, label]) => ({
  value,
  label,
}));

export const hiringRejectionReasonOptions = (
  Object.entries(
    hiringRejectionReasonLabels,
  ) as Array<[HiringRejectionReason, string]>
).map(([value, label]) => ({
  value,
  label,
}));

export const hiringDelayReasonOptions = (
  Object.entries(
    hiringDelayReasonLabels,
  ) as Array<[HiringDelayReason, string]>
).map(([value, label]) => ({
  value,
  label,
}));

export const separationReasonOptions = (
  Object.entries(
    separationReasonLabels,
  ) as Array<[SeparationReason, string]>
).map(([value, label]) => ({
  value,
  label,
}));