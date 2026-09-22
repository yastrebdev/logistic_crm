"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  message,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type {
  ColumnsType,
  TablePaginationConfig,
} from "antd/es/table";
import { useQuery } from "@tanstack/react-query";
import dayjs, {
  type Dayjs,
} from "dayjs";

import { useCurrentUser } from "@/hooks/use-current-user";
import {
    exportOnboardingAnalytics,
  getOnboardingAnalytics,
  type OnboardingAnalyticsFilters,
  type OnboardingAnalyticsRow,
} from "@/lib/api/onboarding-analytics";
import {
  getDistributionCenters,
  getDivisionGroups,
  getDivisions,
  getPositions,
} from "@/lib/api/organization";
import { getAllUsers } from "@/lib/api/users";
import {
  adaptationProcessStatusColors,
  adaptationProcessStatusLabels,
  adaptationStageStatusColors,
  adaptationStageStatusLabels,
  riskZoneColors,
  riskZoneLabels,
} from "@/lib/adaptation-labels";
import {
  admissionFormatLabels,
  mentorAssignmentStatusLabels,
  nonPaymentReasonLabels,
  paymentStatusColors,
  paymentStatusLabels,
} from "@/lib/onboarding-labels";
import {
  candidateTypeLabels,
  hiringDelayReasonLabels,
  hiringRejectionReasonLabels,
  separationReasonLabels,
} from "@/lib/employee-labels";
import {
  positionCategoryLabels,
} from "@/lib/adaptation-labels";
import { hasPermission } from "@/lib/permissions";


const { RangePicker } = DatePicker;


function formatDate(
  value: string | null,
): string {
  return value
    ? dayjs(value).format("DD.MM.YYYY")
    : "—";
}


function formatBoolean(
  value: boolean | null,
): string {
  if (value === null) {
    return "—";
  }

  return value ? "Да" : "Нет";
}


function formatMoney(
  value: string | null,
): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat(
    "ru-RU",
    {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 2,
    },
  ).format(Number(value));
}


function complianceTag(
  value: boolean | null,
) {
  if (value === null) {
    return "—";
  }

  return value ? (
    <Tag color="success">Соблюдён</Tag>
  ) : (
    <Tag color="error">Нарушен</Tag>
  );
}


function StageColumns({
  stageNumber,
}: {
  stageNumber: 1 | 2 | 3;
}): ColumnsType<OnboardingAnalyticsRow> {
  const stageKey =
    `adaptation_stage_${stageNumber}` as const;

  return [
    {
      title: "План с",
      width: 120,
      render: (_, row) =>
        formatDate(
          row[stageKey]?.planned_start_date ??
            null,
        ),
    },
    {
      title: "План до",
      width: 120,
      render: (_, row) =>
        formatDate(
          row[stageKey]?.planned_end_date ??
            null,
        ),
    },
    {
      title: "Проведена",
      width: 120,
      render: (_, row) =>
        formatDate(
          row[stageKey]?.actual_date ?? null,
        ),
    },
    {
      title: "Статус",
      width: 130,
      render: (_, row) => {
        const stage = row[stageKey];

        if (!stage) {
          return "—";
        }

        return (
          <Tag
            color={
              adaptationStageStatusColors[
                stage.stage_status
              ]
            }
          >
            {
              adaptationStageStatusLabels[
                stage.stage_status
              ]
            }
          </Tag>
        );
      },
    },
    {
      title: "Опоздание",
      width: 120,
      render: (_, row) => {
        const stage = row[stageKey];

        if (!stage) {
          return "—";
        }

        return stage.delay_days > 0
          ? `${stage.delay_days} дн.`
          : "Нет";
      },
    },
    {
      title: "Зона",
      width: 110,
      render: (_, row) => {
        const zone = row[stageKey]?.zone;

        if (!zone) {
          return "—";
        }

        return (
          <Tag color={riskZoneColors[zone]}>
            {riskZoneLabels[zone]}
          </Tag>
        );
      },
    },
    {
      title: "Риск зоны",
      width: 120,
      render: (_, row) => {
        const riskZone =
          row[stageKey]?.risk_zone;

        if (!riskZone) {
          return "—";
        }

        return (
          <Tag
            color={riskZoneColors[riskZone]}
          >
            {riskZoneLabels[riskZone]}
          </Tag>
        );
      },
    },
    {
      title: "Комментарий",
      width: 260,
      ellipsis: true,
      render: (_, row) =>
        row[stageKey]?.comment ?? "—",
    },
  ];
}


export default function OnboardingAnalyticsPage() {
    const [messageApi, contextHolder] =
    message.useMessage();

  const [
    isExporting,
    setIsExporting,
  ] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState(20);

  const [
    distributionCenterId,
    setDistributionCenterId,
  ] = useState<number>();

  const [
    divisionGroupId,
    setDivisionGroupId,
  ] = useState<number>();

  const [divisionId, setDivisionId] =
    useState<number>();

  const [positionId, setPositionId] =
    useState<number>();

  const [tutorId, setTutorId] =
    useState<number>();

  const [hireDates, setHireDates] =
    useState<
      [Dayjs | null, Dayjs | null] | null
    >(null);

    const [
    employeeSearchDraft,
    setEmployeeSearchDraft,
  ] = useState("");

  const [
    employeeSearch,
    setEmployeeSearch,
  ] = useState("");

  const [
    overdueOnly,
    setOverdueOnly,
  ] = useState(false);

  const [
    hasRiskOnly,
    setHasRiskOnly,
  ] = useState(false);

  const [
    paymentPendingOnly,
    setPaymentPendingOnly,
  ] = useState(false);

  const { data: currentUser } =
    useCurrentUser();

  /*
   * Пока backend использует organization.read
   * для доступа к отчёту.
   */
  const canRead =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "organization.read",
    );

  const filters =
    useMemo<OnboardingAnalyticsFilters>(
      () => ({
        page,
        pageSize,
        distributionCenterId,
        divisionGroupId,
        divisionId,
        positionId,
        tutorId,
        hireDateFrom:
          hireDates?.[0]?.format(
            "YYYY-MM-DD",
          ),
        hireDateTo:
          hireDates?.[1]?.format(
            "YYYY-MM-DD",
          ),
        employeeSearch:
        employeeSearch || undefined,
        overdueOnly,
        hasRiskOnly,
        paymentPendingOnly,
      }),
      [
        page,
        pageSize,
        distributionCenterId,
        divisionGroupId,
        divisionId,
        positionId,
        tutorId,
        hireDates,
        employeeSearch,
        overdueOnly,
        hasRiskOnly,
        paymentPendingOnly,
      ],
    );

  const analyticsQuery = useQuery({
    queryKey: [
      "onboarding-analytics",
      filters,
    ],
    queryFn: () =>
      getOnboardingAnalytics(filters),
    enabled: canRead,
  });

  const centersQuery = useQuery({
    queryKey: ["distribution-centers"],
    queryFn: getDistributionCenters,
    enabled: canRead,
  });

  const groupsQuery = useQuery({
    queryKey: ["division-groups"],
    queryFn: getDivisionGroups,
    enabled: canRead,
  });

  const divisionsQuery = useQuery({
    queryKey: [
      "divisions",
      divisionGroupId,
    ],
    queryFn: () =>
      getDivisions(divisionGroupId),
    enabled: canRead,
  });

  const positionsQuery = useQuery({
    queryKey: [
      "positions",
      divisionId,
    ],
    queryFn: () =>
      getPositions(divisionId),
    enabled: canRead,
  });

  const usersQuery = useQuery({
    queryKey: ["users", "all"],
    queryFn: getAllUsers,
    enabled: canRead,
  });

  const resetFilters = () => {
    setDistributionCenterId(undefined);
    setDivisionGroupId(undefined);
    setDivisionId(undefined);
    setPositionId(undefined);
    setTutorId(undefined);
    setHireDates(null);

    setEmployeeSearchDraft("");
    setEmployeeSearch("");

    setOverdueOnly(false);
    setHasRiskOnly(false);
    setPaymentPendingOnly(false);

    setPage(1);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      await exportOnboardingAnalytics(
        filters,
      );

      messageApi.success(
        "Отчёт сформирован",
      );
    } catch (error) {
      messageApi.error(
        error instanceof Error
          ? error.message
          : "Не удалось выгрузить отчёт",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleGroupChange = (
    value: number | undefined,
  ) => {
    setDivisionGroupId(value);
    setDivisionId(undefined);
    setPositionId(undefined);
    setPage(1);
  };

  const handleDivisionChange = (
    value: number | undefined,
  ) => {
    setDivisionId(value);
    setPositionId(undefined);
    setPage(1);
  };

  const columns =
    useMemo<
      ColumnsType<OnboardingAnalyticsRow>
    >(
      () => [
        {
          title: "ID",
          dataIndex:
            "introductory_process_id",
          key: "id",
          width: 80,
          fixed: "left",
        },
        {
          title: "Сотрудник",
          dataIndex: "employee_name",
          key: "employee_name",
          width: 250,
          fixed: "left",
        },
        {
          title: "Табельный номер",
          dataIndex: "personnel_number",
          key: "personnel_number",
          width: 160,
          fixed: "left",
          render: (
            value: string | null,
          ) => value ?? "—",
        },
        {
          title: "Организация",
          children: [
            {
              title: "РЦ",
              dataIndex:
                "distribution_center_name",
              width: 180,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
            {
              title: "Подразделение",
              dataIndex: "division_name",
              width: 290,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
            {
              title: "Группа",
              dataIndex:
                "division_group_abbreviation",
              width: 130,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
            {
              title: "Должность",
              dataIndex: "position_name",
              width: 230,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
            {
              title: "Статус должности",
              dataIndex:
                "position_category",
              width: 180,
              render: (
                value:
                  | OnboardingAnalyticsRow[
                      "position_category"
                    ],
              ) =>
                value
                  ? positionCategoryLabels[
                      value
                    ]
                  : "—",
            },
            {
              title: "Руководитель",
              dataIndex: "manager_name",
              width: 230,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
          ],
        },
        {
          title: "Приём",
          children: [
            {
              title: "Дата ТУ",
              dataIndex: "hire_date",
              width: 125,
              render: formatDate,
            },
            {
              title: "Статус ТУ",
              dataIndex: "candidate_type",
              width: 170,
              render: (
                value:
                  OnboardingAnalyticsRow[
                    "candidate_type"
                  ],
              ) =>
                candidateTypeLabels[value],
            },
            {
              title: "Причина не ТУ",
              dataIndex:
                "reason_not_hiring",
              width: 220,
              render: (
                value:
                  OnboardingAnalyticsRow[
                    "reason_not_hiring"
                  ],
              ) =>
                value
                  ? hiringRejectionReasonLabels[
                      value
                    ]
                  : "—",
            },
            {
              title: "Причина задержки",
              dataIndex:
                "reason_delayed_hiring",
              width: 220,
              render: (
                value:
                  OnboardingAnalyticsRow[
                    "reason_delayed_hiring"
                  ],
              ) =>
                value
                  ? hiringDelayReasonLabels[
                      value
                    ]
                  : "—",
            },
            {
              title: "Комментарий МПО",
              dataIndex:
                "hiring_comment",
              width: 260,
              ellipsis: true,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
          ],
        },
        {
          title: "Вводное обучение",
          children: [
            {
              title: "Начало процесса",
              dataIndex:
                "introductory_start_date",
              width: 140,
              render: formatDate,
            },
            {
              title: "Завершение",
              dataIndex:
                "introductory_end_date",
              width: 140,
              render: formatDate,
            },
            {
              title: "Куратор МПО",
              width: 230,
              render: (_, row) =>
                row.tutor_name ??
                row.tutor_email,
            },
            {
              title:
                "Дата ознакомительной стажировки",
              dataIndex:
                "introductory_internship_date",
              width: 190,
              render: formatDate,
            },
            {
              title:
                "Наставник ознакомительной стажировки",
              dataIndex:
                "introductory_mentor_name",
              width: 270,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
            {
              title: "Дата обучения",
              dataIndex: "training_date",
              width: 140,
              render: formatDate,
            },
            {
              title: "Формат допуска",
              dataIndex:
                "admission_format",
              width: 220,
              render: (
                value:
                  OnboardingAnalyticsRow[
                    "admission_format"
                  ],
              ) =>
                value
                  ? admissionFormatLabels[
                      value
                    ]
                  : "—",
            },
            {
              title: "Дата проверки",
              dataIndex: "test_date",
              width: 140,
              render: formatDate,
            },
            {
              title: "Результат",
              dataIndex: "test_result",
              width: 120,
              render: (
                value: number | null,
              ) =>
                value === null
                  ? "—"
                  : `${value}%`,
            },
          ],
        },
        {
          title: "Основная стажировка",
          children: [
            {
              title: "Начало",
              dataIndex:
                "main_internship_start_date",
              width: 130,
              render: formatDate,
            },
            {
              title: "Окончание",
              dataIndex:
                "main_internship_end_date",
              width: 130,
              render: formatDate,
            },
            {
              title: "Норматив",
              width: 140,
              render: (_, row) => {
                if (
                  row
                    .internship_duration_min_days ===
                    null ||
                  row
                    .internship_duration_max_days ===
                    null
                ) {
                  return "—";
                }

                if (
                  row
                    .internship_duration_min_days ===
                  row
                    .internship_duration_max_days
                ) {
                  return `${row.internship_duration_min_days} дн.`;
                }

                return (
                  `${row.internship_duration_min_days}` +
                  `–${row.internship_duration_max_days} дн.`
                );
              },
            },
            {
              title: "Фактически",
              dataIndex:
                "actual_internship_duration_days",
              width: 130,
              render: (
                value: number | null,
              ) =>
                value === null
                  ? "—"
                  : `${value} дн.`,
            },
            {
              title: "Срок соблюдён",
              dataIndex:
                "internship_duration_compliant",
              width: 150,
              render: complianceTag,
            },
            {
              title: "Наставник",
              dataIndex:
                "main_mentor_name",
              width: 240,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
            {
              title:
                "Должность наставника",
              dataIndex:
                "main_mentor_position_name",
              width: 220,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
            {
              title:
                "Статус назначения наставника",
              dataIndex:
                "mentor_assignment_status",
              width: 230,
              render: (
                value:
                  OnboardingAnalyticsRow[
                    "mentor_assignment_status"
                  ],
              ) =>
                value
                  ? mentorAssignmentStatusLabels[
                      value
                    ]
                  : "—",
            },
            {
              title:
                "Лист стажировки получен",
              dataIndex:
                "internship_form_completed",
              width: 190,
              render: formatBoolean,
            },
          ],
        },
        {
          title: "Оплата наставнику",
          children: [
            {
              title:
                "Оплата предусмотрена",
              dataIndex:
                "mentor_payment_expected",
              width: 170,
              render: formatBoolean,
            },
            {
              title: "Срок заведения",
              dataIndex:
                "payment_due_date",
              width: 140,
              render: formatDate,
            },
            {
              title:
                "Рекомендуемая сумма",
              dataIndex:
                "planned_payment_amount",
              width: 190,
              render: formatMoney,
            },
            {
              title:
                "Фактическая сумма",
              dataIndex:
                "actual_payment_amount",
              width: 170,
              render: formatMoney,
            },
            {
              title: "Дата заведения",
              dataIndex:
                "payment_created_at",
              width: 150,
              render: formatDate,
            },
            {
              title: "Дата выплаты",
              dataIndex:
                "payment_paid_at",
              width: 140,
              render: formatDate,
            },
            {
              title: "Статус",
              dataIndex: "payment_status",
              width: 150,
              render: (
                value:
                  OnboardingAnalyticsRow[
                    "payment_status"
                  ],
              ) =>
                value ? (
                  <Tag
                    color={
                      paymentStatusColors[
                        value
                      ]
                    }
                  >
                    {
                      paymentStatusLabels[
                        value
                      ]
                    }
                  </Tag>
                ) : (
                  "—"
                ),
            },
            {
              title:
                "Оплачено полностью",
              dataIndex:
                "payment_is_fully_paid",
              width: 170,
              render: formatBoolean,
            },
            {
              title: "Причина неоплаты",
              dataIndex:
                "non_payment_reason",
              width: 260,
              render: (
                value:
                  OnboardingAnalyticsRow[
                    "non_payment_reason"
                  ],
              ) =>
                value
                  ? nonPaymentReasonLabels[
                      value
                    ]
                  : "—",
            },
            {
              title:
                "Как заведена премия",
              dataIndex:
                "payment_registration_method",
              width: 200,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
          ],
        },
        {
          title: "Адаптация",
          children: [
            {
              title: "Статус процесса",
              dataIndex:
                "adaptation_status",
              width: 160,
              render: (
                value:
                  OnboardingAnalyticsRow[
                    "adaptation_status"
                  ],
              ) =>
                value ? (
                  <Tag
                    color={
                      adaptationProcessStatusColors[
                        value
                      ]
                    }
                  >
                    {
                      adaptationProcessStatusLabels[
                        value
                      ]
                    }
                  </Tag>
                ) : (
                  "—"
                ),
            },
            {
              title: "Общий дедлайн",
              dataIndex:
                "adaptation_deadline_date",
              width: 150,
              render: formatDate,
            },
            {
              title: "Дней после ТУ",
              dataIndex:
                "days_since_hire",
              width: 140,
              render: (
                value: number | null,
              ) => value ?? "—",
            },
            {
              title: "1 адаптация",
              children: StageColumns({
                stageNumber: 1,
              }),
            },
            {
              title: "2 адаптация",
              children: StageColumns({
                stageNumber: 2,
              }),
            },
            {
              title: "3 адаптация",
              children: StageColumns({
                stageNumber: 3,
              }),
            },
            {
              title: "ИС пройден успешно",
              dataIndex:
                "probation_completed_successfully",
              width: 180,
              render: formatBoolean,
            },
          ],
        },
        {
          title: "Увольнение",
          children: [
            {
              title: "Дата увольнения",
              dataIndex:
                "separation_date",
              width: 150,
              render: formatDate,
            },
            {
              title: "Причина",
              dataIndex:
                "separation_reason",
              width: 260,
              render: (
                value:
                  OnboardingAnalyticsRow[
                    "separation_reason"
                  ],
              ) =>
                value
                  ? separationReasonLabels[
                      value
                    ]
                  : "—",
            },
            {
              title:
                "Обратная связь руководителя",
              dataIndex:
                "manager_separation_feedback",
              width: 300,
              ellipsis: true,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
          ],
        },
      ],
      [],
    );

  const handleTableChange = (
    pagination: TablePaginationConfig,
  ) => {
    setPage(pagination.current ?? 1);
    setPageSize(
      pagination.pageSize ?? 20,
    );
  };

  if (
    currentUser !== undefined &&
    !canRead
  ) {
    return (
      <Alert
        type="error"
        title="Недостаточно прав"
        description={
          "Нет разрешения organization.read"
        }
        showIcon
      />
    );
  }

  return (
    <Space
      orientation="vertical"
      size="large"
      style={{ width: "100%" }}
    >
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Typography.Title
            level={2}
            style={{ marginBottom: 4 }}
          >
            Аналитика вводного процесса
          </Typography.Title>

          <Typography.Text type="secondary">
            Вводное обучение, стажировки,
            выплаты наставникам и адаптация
            сотрудников
          </Typography.Text>
        </div>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          loading={isExporting}
          disabled={
            analyticsQuery.isLoading
          }
          onClick={handleExport}
        >
          Выгрузить в Excel
        </Button>
      </div>

      <Col xs={24} lg={12} xl={8}>
        <Input.Search
          allowClear
          value={employeeSearchDraft}
          placeholder={
            "ФИО или табельный номер"
          }
          enterButton={
            <SearchOutlined />
          }
          onChange={(event) => {
            const value =
              event.target.value;

            setEmployeeSearchDraft(
              value,
            );

            if (!value) {
              setEmployeeSearch("");
              setPage(1);
            }
          }}
          onSearch={(value) => {
            setEmployeeSearch(
              value.trim(),
            );
            setPage(1);
          }}
        />
      </Col>

      <Card size="small">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12} xl={6}>
            <Select
              allowClear
              showSearch
              value={
                distributionCenterId
              }
              placeholder="Распределительный центр"
              style={{ width: "100%" }}
              loading={
                centersQuery.isLoading
              }
              optionFilterProp="label"
              options={(
                centersQuery.data ?? []
              ).map((center) => ({
                value: center.id,
                label: `${center.code} — ${center.name}`,
              }))}
              onChange={(value) => {
                setDistributionCenterId(
                  value,
                );
                setPage(1);
              }}
            />
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Select
              allowClear
              showSearch
              value={divisionGroupId}
              placeholder="Группа подразделений"
              style={{ width: "100%" }}
              loading={
                groupsQuery.isLoading
              }
              optionFilterProp="label"
              options={(
                groupsQuery.data ?? []
              ).map((group) => ({
                value: group.id,
                label:
                  group.abbreviation,
              }))}
              onChange={
                handleGroupChange
              }
            />
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Select
              allowClear
              showSearch
              value={divisionId}
              placeholder="Подразделение"
              style={{ width: "100%" }}
              loading={
                divisionsQuery.isLoading
              }
              optionFilterProp="label"
              options={(
                divisionsQuery.data ?? []
              ).map((division) => ({
                value: division.id,
                label: division.name,
              }))}
              onChange={
                handleDivisionChange
              }
            />
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Select
              allowClear
              showSearch
              value={positionId}
              placeholder="Должность"
              style={{ width: "100%" }}
              loading={
                positionsQuery.isLoading
              }
              optionFilterProp="label"
              options={(
                positionsQuery.data ?? []
              ).map((position) => ({
                value: position.id,
                label: position.name,
              }))}
              onChange={(value) => {
                setPositionId(value);
                setPage(1);
              }}
            />
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Select
              allowClear
              showSearch
              value={tutorId}
              placeholder="Куратор МПО"
              style={{ width: "100%" }}
              loading={
                usersQuery.isLoading
              }
              optionFilterProp="label"
              options={(
                usersQuery.data ?? []
              ).map((user) => ({
                value: user.id,
                label:
                  user.full_name ??
                  user.email,
              }))}
              onChange={(value) => {
                setTutorId(value);
                setPage(1);
              }}
            />
          </Col>

          <Col xs={24} md={12} xl={8}>
            <RangePicker
              value={hireDates}
              format="DD.MM.YYYY"
              placeholder={[
                "Дата ТУ с",
                "Дата ТУ по",
              ]}
              style={{ width: "100%" }}
              onChange={(dates) => {
                setHireDates(dates);
                setPage(1);
              }}
            />
          </Col>

                    <Col xs={24}>
            <Space
              size="large"
              wrap
            >
              <Space size="small">
                <Switch
                  checked={overdueOnly}
                  onChange={(checked) => {
                    setOverdueOnly(
                      checked,
                    );
                    setPage(1);
                  }}
                />

                <Typography.Text>
                  Просроченные адаптации
                </Typography.Text>
              </Space>

              <Space size="small">
                <Switch
                  checked={hasRiskOnly}
                  onChange={(checked) => {
                    setHasRiskOnly(
                      checked,
                    );
                    setPage(1);
                  }}
                />

                <Typography.Text>
                  Есть риск
                </Typography.Text>
              </Space>

              <Space size="small">
                <Switch
                  checked={
                    paymentPendingOnly
                  }
                  onChange={(checked) => {
                    setPaymentPendingOnly(
                      checked,
                    );
                    setPage(1);
                  }}
                />

                <Typography.Text>
                  Ожидается оплата
                </Typography.Text>
              </Space>
            </Space>
          </Col>

          <Col xs={24}>
            <Button
              onClick={resetFilters}
            >
              Сбросить фильтры
            </Button>
          </Col>
        </Row>
      </Card>

      {analyticsQuery.error && (
        <Alert
          type="error"
          title="Не удалось загрузить отчёт"
          description={
            analyticsQuery.error.message
          }
          showIcon
        />
      )}

      <Table<OnboardingAnalyticsRow>
        rowKey="introductory_process_id"
        loading={
          analyticsQuery.isLoading
        }
        columns={columns}
        dataSource={
          analyticsQuery.data?.items ?? []
        }
        bordered
        size="small"
        scroll={{
          x: "max-content",
          y: "calc(100vh - 420px)",
        }}
        pagination={{
          current:
            analyticsQuery.data?.page ??
            page,
          pageSize:
            analyticsQuery.data
              ?.page_size ?? pageSize,
          total:
            analyticsQuery.data?.total ??
            0,
          showSizeChanger: true,
          pageSizeOptions: [
            20,
            50,
            100,
          ],
          showTotal: (total) =>
            `Всего: ${total}`,
        }}
        locale={{
          emptyText:
            "Данных для отчёта пока нет",
        }}
        onChange={handleTableChange}
      />
    </Space>
  );
}