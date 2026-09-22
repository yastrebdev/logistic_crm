"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Card,
  Descriptions,
  Drawer,
  Space,
  Spin,
  Tag,
} from "antd";
import dayjs from "dayjs";

import { AdaptationStages } from "@/components/adaptations/adaptation-stages";
import { getAdaptationDetails } from "@/lib/api/adaptations";
import type { Employee } from "@/lib/api/employees";
import type { IntroductoryProcess } from "@/lib/api/introductory-processes";
import type { User } from "@/lib/api/users";
import {
  adaptationProcessStatusColors,
  adaptationProcessStatusLabels,
  positionCategoryLabels,
} from "@/lib/adaptation-labels";

type AdaptationDetailsDrawerProps = {
  open: boolean;
  adaptationId: number | null;
  introductoryProcesses: IntroductoryProcess[];
  employees: Employee[];
  users: User[];
  canUpdate: boolean;
  onClose: () => void;
};

function formatDate(value: string | null): string {
  return value ? dayjs(value).format("DD.MM.YYYY") : "—";
}

function formatDateTime(value: string | null): string {
  return value ? dayjs(value).format("DD.MM.YYYY HH:mm") : "—";
}

export function AdaptationDetailsDrawer({
  open,
  adaptationId,
  introductoryProcesses,
  employees,
  users,
  canUpdate,
  onClose,
}: AdaptationDetailsDrawerProps) {
  const adaptationQuery = useQuery({
    queryKey: ["adaptation", adaptationId],
    queryFn: () => getAdaptationDetails(adaptationId as number),
    enabled: open && adaptationId !== null,
  });

  const adaptation = adaptationQuery.data;
  const introductoryProcess = adaptation
    ? introductoryProcesses.find(
        (process) => process.id === adaptation.introductory_process_id,
      )
    : undefined;
  const employee = introductoryProcess
    ? employees.find((item) => item.id === introductoryProcess.employee_id)
    : undefined;
  const tutor = introductoryProcess
    ? users.find((item) => item.id === introductoryProcess.tutor_id)
    : undefined;

  return (
    <Drawer
      title={employee ? `Адаптация: ${employee.full_name}` : "Адаптация"}
      open={open}
      size="large"
      destroyOnHidden
      onClose={onClose}
    >
      {adaptationQuery.isLoading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Spin size="large" />
        </div>
      )}

      {adaptationQuery.error && (
        <Alert
          type="error"
          title="Не удалось загрузить адаптацию"
          description={adaptationQuery.error.message}
          showIcon
        />
      )}

      {adaptation && (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Card title="Общие сведения">
            <Descriptions
              bordered
              size="small"
              column={1}
              items={[
                {
                  key: "employee",
                  label: "Сотрудник",
                  children: employee?.full_name ?? "—",
                },
                {
                  key: "personnel-number",
                  label: "Табельный номер",
                  children: employee?.personnel_number ?? "—",
                },
                {
                  key: "tutor",
                  label: "МПО",
                  children: tutor?.email ?? "—",
                },
                {
                  key: "deadline",
                  label: "Общий дедлайн",
                  children: formatDate(adaptation.deadline_date),
                },
                {
                  key: "status",
                  label: "Статус",
                  children: (
                    <Tag color={adaptationProcessStatusColors[adaptation.status]}>
                      {adaptationProcessStatusLabels[adaptation.status]}
                    </Tag>
                  ),
                },
                {
                  key: "created-at",
                  label: "Создана",
                  children: formatDateTime(adaptation.created_at),
                },
                {
                  key: "completed-at",
                  label: "Завершена",
                  children: formatDateTime(adaptation.completed_at),
                },
              ]}
            />
          </Card>

          <Card title="Применённое правило">
            <Descriptions
              bordered
              size="small"
              column={1}
              items={[
                {
                  key: "category",
                  label: "Категория должности",
                  children: positionCategoryLabels[adaptation.policy.position_category],
                },
                {
                  key: "period",
                  label: "Период действия",
                  children: `${formatDate(adaptation.policy.effective_from)} — ${formatDate(adaptation.policy.effective_to)}`,
                },
                {
                  key: "deadline-days",
                  label: "Общий срок",
                  children: `${adaptation.policy.total_deadline_days} дн.`,
                },
              ]}
            />
          </Card>

          <AdaptationStages adaptation={adaptation} canUpdate={canUpdate} />
        </Space>
      )}
    </Drawer>
  );
}
