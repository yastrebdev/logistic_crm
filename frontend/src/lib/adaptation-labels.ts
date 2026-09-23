import type {
  AdaptationDelayReason,
  AdaptationParticipants,
  AdaptationProcessStatus,
  AdaptationRiskReason,
  AdaptationStageStatus,
  MethodExecutionAdaptation,
  RiskZone,
} from "@/lib/api/adaptations";
import type { PositionCategory } from "@/lib/api/organization";

export const adaptationProcessStatusLabels: Record<
  AdaptationProcessStatus,
  string
> = {
  Active: "В процессе",
  Completed: "Завершена",
  Cancelled: "Отменена",
};

export const adaptationProcessStatusColors: Record<
  AdaptationProcessStatus,
  string
> = {
  Active: "processing",
  Completed: "success",
  Cancelled: "default",
};

export const adaptationStageStatusLabels: Record<
  AdaptationStageStatus,
  string
> = {
  upcoming: "Предстоит",
  due: "Можно проводить",
  overdue: "Просрочено",
  completed: "Проведено",
};

export const adaptationStageStatusColors: Record<
  AdaptationStageStatus,
  string
> = {
  upcoming: "default",
  due: "processing",
  overdue: "error",
  completed: "success",
};

export const adaptationMethodLabels: Record<
  MethodExecutionAdaptation,
  string
> = {
  "in person": "Очно",
  "on portal": "На портале",
  "a phone call": "Телефонный звонок",
  "yandex form": "Яндекс-форма",
};

export const adaptationMethodOptions = (
  Object.entries(
    adaptationMethodLabels,
  ) as Array<
    [MethodExecutionAdaptation, string]
  >
).map(([value, label]) => ({
  value,
  label,
}));

export const adaptationParticipantsLabels: Record<
  AdaptationParticipants,
  string
> = {
  MPO: "МПО",
  "MPO and MPP": "МПО и МПП",
  "MPO and supervisor":
    "МПО и руководитель",
  "MPO, MPP and supervisor":
    "МПО, МПП и руководитель",
};

export const adaptationParticipantsOptions = (
  Object.entries(
    adaptationParticipantsLabels,
  ) as Array<
    [AdaptationParticipants, string]
  >
).map(([value, label]) => ({
  value,
  label,
}));

export const riskZoneLabels: Record<
  RiskZone,
  string
> = {
  yellow: "Жёлтая",
  red: "Красная",
};

export const riskZoneColors: Record<
  RiskZone,
  string
> = {
  yellow: "warning",
  red: "error",
};

export const riskZoneOptions = (
  Object.entries(riskZoneLabels) as Array<
    [RiskZone, string]
  >
).map(([value, label]) => ({
  value,
  label,
}));

export const adaptationDelayReasonLabels: Record<
  AdaptationDelayReason,
  string
> = {
  "Employee absent":
    "Отсутствие сотрудника",
  "Supervisor absent":
    "Отсутствие руководителя",
  "MPO absent": "Отсутствие МПО",
  "MPP absent": "Отсутствие МПП",
  "Schedule conflict":
    "Конфликт расписания",
  "Technical issues":
    "Технические проблемы",
  "High workload":
    "Высокая рабочая нагрузка",
  "Adaptation rescheduled":
    "Адаптация перенесена",
  Other: "Другое",
};

export const adaptationDelayReasonOptions = (
  Object.entries(
    adaptationDelayReasonLabels,
  ) as Array<
    [AdaptationDelayReason, string]
  >
).map(([value, label]) => ({
  value,
  label,
}));

export const adaptationRiskReasonLabels: Record<
  AdaptationRiskReason,
  string
> = {
  "Low performance":
    "Низкая производительность",
  "Insufficient skills":
    "Недостаточные навыки",
  "Low motivation": "Низкая мотивация",
  "Attendance issues":
    "Проблемы с посещаемостью",
  "Disciplinary issues":
    "Дисциплинарные нарушения",
  "Difficulties working with the team":
    "Сложности в работе с коллективом",
  "Difficulties working with the supervisor":
    "Сложности в работе с руководителем",
  "Failure to meet adaptation goals":
    "Невыполнение целей адаптации",
  Other: "Другое",
};

export const adaptationRiskReasonOptions = (
  Object.entries(
    adaptationRiskReasonLabels,
  ) as Array<
    [AdaptationRiskReason, string]
  >
).map(([value, label]) => ({
  value,
  label,
}));

export const positionCategoryLabels: Record<
  PositionCategory,
  string
> = {
  line_staff: "Линейный персонал",
  specialist: "Специалист",
  manager: "Руководитель",
  head: "Директор",
};

export const positionCategoryOptions = (
  Object.entries(
    positionCategoryLabels,
  ) as Array<[PositionCategory, string]>
).map(([value, label]) => ({
  value,
  label,
}));