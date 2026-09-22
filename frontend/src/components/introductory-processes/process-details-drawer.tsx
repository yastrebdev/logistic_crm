"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Card,
  Descriptions,
  Drawer,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";

import { IntroductoryInternshipsSection } from "./introductory-internships-section";
import { MainInternshipsSection } from "./main-internships-section";
import { TrainingsSection } from "./trainings-section";
import { AdaptationSection } from "@/components/adaptations/adaptation-section";
import type { Employee } from "@/lib/api/employees";
import { getIntroductoryProcessDetails } from "@/lib/api/introductory-processes";
import {
  USER_TYPE_LABELS,
  type User,
} from "@/lib/api/users";

type ProcessDetailsDrawerProps = {
  open: boolean;
  processId: number | null;
  employees: Employee[];
  users: User[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
};

function formatDate(
  value: string | null,
): string {
  return value
    ? dayjs(value).format("DD.MM.YYYY")
    : "—";
}

export function ProcessDetailsDrawer({
  open,
  processId,
  employees,
  users,
  canCreate,
  canUpdate,
  canDelete,
  onClose,
}: ProcessDetailsDrawerProps) {
  const detailsQuery = useQuery({
    queryKey: [
      "introductory-process-details",
      processId,
    ],
    queryFn: () =>
      getIntroductoryProcessDetails(
        processId as number,
      ),
    enabled: open && processId !== null,
  });

  const employeeById = useMemo(
    () =>
      new Map(
        employees.map((employee) => [
          employee.id,
          employee,
        ]),
      ),
    [employees],
  );

  const userById = useMemo(
    () =>
      new Map(
        users.map((user) => [
          user.id,
          user,
        ]),
      ),
    [users],
  );

  const process = detailsQuery.data;

  const employee = process
    ? employeeById.get(process.employee_id)
    : undefined;

  const tutor = process
    ? userById.get(process.tutor_id)
    : undefined;

  const title = employee
    ? `Вводное обучение: ${employee.full_name}`
    : "Вводное обучение";

  return (
    <Drawer
      title={title}
      open={open}
      size="large"
      destroyOnHidden
      onClose={onClose}
    >
      {detailsQuery.isLoading && (
        <div
          style={{
            minHeight: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Spin size="large" />
        </div>
      )}

      {detailsQuery.error && (
        <Alert
          type="error"
          title="Не удалось загрузить детали вводного процесса"
          description={
            detailsQuery.error.message
          }
          showIcon
        />
      )}

      {process && (
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%" }}
        >
          <Card title="Общие сведения">
            <Descriptions
              bordered
              size="small"
              column={2}
              items={[
                {
                  key: "employee",
                  label: "Сотрудник",
                  children: employee ? (
                    <Space
                      direction="vertical"
                      size={0}
                    >
                      <Typography.Text>
                        {employee.full_name}
                      </Typography.Text>

                      <Typography.Text
                        type="secondary"
                      >
                        Табельный номер:{" "}
                        {employee.personnel_number ??
                          "—"}
                      </Typography.Text>
                    </Space>
                  ) : (
                    `Сотрудник #${process.employee_id}`
                  ),
                },
                {
                  key: "tutor",
                  label:
                    "Ответственный за вводное",
                  children: tutor ? (
                    <Space
                      direction="vertical"
                      size={0}
                    >
                      <Typography.Text>
                        {tutor.email}
                      </Typography.Text>

                      <Typography.Text
                        type="secondary"
                      >
                        {
                          USER_TYPE_LABELS[
                            tutor.user_type
                          ]
                        }
                      </Typography.Text>
                    </Space>
                  ) : (
                    `Пользователь #${process.tutor_id}`
                  ),
                },
                {
                  key: "start-date",
                  label: "Дата начала",
                  children: formatDate(
                    process.start_date,
                  ),
                },
                {
                  key: "end-date",
                  label: "Дата окончания",
                  children: formatDate(
                    process.end_date,
                  ),
                },
                {
                  key: "status",
                  label: "Состояние",
                  children:
                    process.end_date === null ? (
                      <Tag color="processing">
                        В процессе
                      </Tag>
                    ) : (
                      <Tag color="success">
                        Завершён
                      </Tag>
                    ),
                },
                {
                  key: "id",
                  label: "Номер процесса",
                  children: process.id,
                },
              ]}
            />
          </Card>

          <IntroductoryInternshipsSection
            process={process}
            employees={employees}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />

          <TrainingsSection
            process={process}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />

          <MainInternshipsSection
            process={process}
            employees={employees}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
          <AdaptationSection
              process={process}
              canUpdate={canUpdate}
            />
        </Space>
      )}
    </Drawer>
  );
}