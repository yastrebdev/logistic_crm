"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EyeOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { AdaptationDetailsDrawer } from "@/components/adaptations/adaptation-details-drawer";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getAdaptations,
  type AdaptationProcess,
} from "@/lib/api/adaptations";
import { getEmployees } from "@/lib/api/employees";
import { getIntroductoryProcesses } from "@/lib/api/introductory-processes";
import { getAllUsers } from "@/lib/api/users";
import {
  adaptationProcessStatusColors,
  adaptationProcessStatusLabels,
} from "@/lib/adaptation-labels";
import { hasPermission } from "@/lib/permissions";

function formatDate(value: string | null): string {
  return value ? dayjs(value).format("DD.MM.YYYY") : "—";
}

export default function AdaptationsPage() {
  const [selectedAdaptationId, setSelectedAdaptationId] =
    useState<number | null>(null);

  const { data: currentUser } = useCurrentUser();

  const canRead =
    currentUser !== undefined &&
    hasPermission(currentUser.permissions, "onboarding.read");

  const canUpdate =
    currentUser !== undefined &&
    hasPermission(currentUser.permissions, "onboarding.update");

  const adaptationsQuery = useQuery({
    queryKey: ["adaptations", {}],
    queryFn: () => getAdaptations(),
    enabled: canRead,
  });

  const introductoryProcessesQuery = useQuery({
    queryKey: ["introductory-processes", {}],
    queryFn: () => getIntroductoryProcesses(),
    enabled: canRead,
  });

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
    enabled: canRead,
  });

  const usersQuery = useQuery({
    queryKey: ["users", "all"],
    queryFn: getAllUsers,
    enabled: canRead,
  });

  const introductoryProcessById = useMemo(
    () =>
      new Map(
        (introductoryProcessesQuery.data ?? []).map((process) => [
          process.id,
          process,
        ]),
      ),
    [introductoryProcessesQuery.data],
  );

  const employeeById = useMemo(
    () =>
      new Map(
        (employeesQuery.data ?? []).map((employee) => [
          employee.id,
          employee,
        ]),
      ),
    [employeesQuery.data],
  );

  const userById = useMemo(
    () =>
      new Map(
        (usersQuery.data ?? []).map((user) => [user.id, user]),
      ),
    [usersQuery.data],
  );

  const columns: ColumnsType<AdaptationProcess> = [
    {
      title: "Сотрудник",
      dataIndex: "introductory_process_id",
      width: 260,
      render: (processId: number) => {
        const process = introductoryProcessById.get(processId);
        const employee = process
          ? employeeById.get(process.employee_id)
          : undefined;

        return employee?.full_name ?? "—";
      },
    },
    {
      title: "Табельный номер",
      dataIndex: "introductory_process_id",
      width: 160,
      render: (processId: number) => {
        const process = introductoryProcessById.get(processId);
        const employee = process
          ? employeeById.get(process.employee_id)
          : undefined;

        return employee?.personnel_number ?? "—";
      },
    },
    {
      title: "МПО",
      dataIndex: "introductory_process_id",
      width: 280,
      render: (processId: number) => {
        const process = introductoryProcessById.get(processId);
        return process
          ? (userById.get(process.tutor_id)?.email ?? "—")
          : "—";
      },
    },
    {
      title: "Дата приёма",
      dataIndex: "introductory_process_id",
      width: 150,
      render: (processId: number) => {
        const process = introductoryProcessById.get(processId);
        const employee = process
          ? employeeById.get(process.employee_id)
          : undefined;

        return formatDate(employee?.hire_date ?? null);
      },
    },
    {
      title: "Общий дедлайн",
      dataIndex: "deadline_date",
      width: 160,
      render: (value: string) => formatDate(value),
    },
    {
      title: "Статус",
      dataIndex: "status",
      width: 150,
      render: (status: AdaptationProcess["status"]) => (
        <Tag color={adaptationProcessStatusColors[status]}>
          {adaptationProcessStatusLabels[status]}
        </Tag>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 130,
      align: "right",
      render: (_, adaptation) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => setSelectedAdaptationId(adaptation.id)}
        >
          Открыть
        </Button>
      ),
    },
  ];

  const error =
    adaptationsQuery.error ||
    introductoryProcessesQuery.error ||
    employeesQuery.error ||
    usersQuery.error;

  const isLoading =
    adaptationsQuery.isLoading ||
    introductoryProcessesQuery.isLoading ||
    employeesQuery.isLoading ||
    usersQuery.isLoading;

  if (currentUser !== undefined && !canRead) {
    return (
      <Alert
        type="error"
        title="Недостаточно прав"
        description="Нет разрешения onboarding.read"
        showIcon
      />
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        title="Не удалось загрузить адаптации"
        description={error.message}
        showIcon
      />
    );
  }

  return (
    <>
      <Space orientation="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Typography.Title level={2} style={{ marginBottom: 4 }}>
            Адаптации
          </Typography.Title>

          <Typography.Text type="secondary">
            Контроль процессов адаптации сотрудников
          </Typography.Text>
        </div>

        <Table<AdaptationProcess>
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={adaptationsQuery.data ?? []}
          scroll={{ x: 1250 }}
          locale={{ emptyText: "Процессов адаптации пока нет" }}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Space>

      <AdaptationDetailsDrawer
        open={selectedAdaptationId !== null}
        adaptationId={selectedAdaptationId}
        introductoryProcesses={introductoryProcessesQuery.data ?? []}
        employees={employeesQuery.data ?? []}
        users={usersQuery.data ?? []}
        canUpdate={canUpdate}
        onClose={() => setSelectedAdaptationId(null)}
      />
    </>
  );
}
