"use client";

import { useMemo, useState } from "react";
import {
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import {
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";

import { EmployeeFormModal } from "@/components/employees/employee-form-modal";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  getEmployees,
  type Employee,
} from "@/lib/api/employees";
import {
    getDistributionCenterDivisions,
  getDistributionCenters,
  getPositions,
  type PositionCategory,
} from "@/lib/api/organization";
import {
  candidateTypeLabels,
  hiringDelayReasonLabels,
  hiringRejectionReasonLabels,
  separationReasonLabels,
} from "@/lib/employee-labels";
import { hasPermission } from "@/lib/permissions";

const positionCategoryLabels: Record<
  PositionCategory,
  string
> = {
  line_staff: "Линейный персонал",
  specialist: "Специалист",
  manager: "Руководитель",
  head: "Директор",
};

const dateFormatter = new Intl.DateTimeFormat(
  "ru-RU",
);

export default function EmployeesPage() {
  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);

  const { data: currentUser } = useCurrentUser();

  const canCreate =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "employees.create",
    );

  const canUpdate =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "employees.update",
    );

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployees,
  });

  const centersQuery = useQuery({
    queryKey: [
      "organization",
      "distribution-centers",
    ],
    queryFn: getDistributionCenters,
  });

  const positionsQuery = useQuery({
    queryKey: ["organization", "positions", "all"],
    queryFn: () => getPositions(),
  });

  const centerDivisionQueries = useQueries({
    queries: (centersQuery.data ?? []).map(
      (center) => ({
        queryKey: [
          "organization",
          "distribution-center-divisions",
          center.id,
        ],
        queryFn: () =>
          getDistributionCenterDivisions(
            center.id,
          ),
      }),
    ),
  });

  const centerDivisions = useMemo(
    () =>
      centerDivisionQueries.flatMap(
        (query) => query.data ?? [],
      ),
    [centerDivisionQueries],
  );

  const employeeById = useMemo(
    () =>
      new Map(
        (employeesQuery.data ?? []).map(
          (employee) => [
            employee.id,
            employee,
          ],
        ),
      ),
    [employeesQuery.data],
  );

  const centerById = useMemo(
    () =>
      new Map(
        (centersQuery.data ?? []).map(
          (center) => [center.id, center],
        ),
      ),
    [centersQuery.data],
  );

  const centerDivisionById = useMemo(
    () =>
      new Map(
        centerDivisions.map((division) => [
          division.id,
          division,
        ]),
      ),
    [centerDivisions],
  );

  const positionById = useMemo(
    () =>
      new Map(
        (positionsQuery.data ?? []).map(
          (position) => [
            position.id,
            position,
          ],
        ),
      ),
    [positionsQuery.data],
  );

  const findEmployeeCenterId = (
    employee: Employee,
  ): number | undefined => {
    if (
      employee.distribution_center_division_id ===
      null
    ) {
      return undefined;
    }

    return centerDivisionById.get(
      employee.distribution_center_division_id,
    )?.distribution_center_id;
  };

  const centerDivisionsLoading =
    centerDivisionQueries.some(
      (query) => query.isLoading,
    );

  const centerDivisionsError =
    centerDivisionQueries.find(
      (query) => query.error,
    )?.error;

  const error =
    employeesQuery.error ||
    centersQuery.error ||
    positionsQuery.error ||
    centerDivisionsError;

  const isLoading =
    employeesQuery.isLoading ||
    centersQuery.isLoading ||
    positionsQuery.isLoading ||
    centerDivisionsLoading;

  if (error) {
    return (
      <Alert
        type="error"
        title="Не удалось загрузить сотрудников"
        description={error.message}
        showIcon
      />
    );
  }

  return (
    <>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <Typography.Title
            level={2}
            style={{ marginBottom: 4 }}
          >
            Сотрудники
          </Typography.Title>

          <Typography.Text type="secondary">
            Управление сотрудниками и их
            организационными назначениями
          </Typography.Text>
        </div>

        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              setIsCreateOpen(true)
            }
          >
            Добавить сотрудника
          </Button>
        )}
      </Space>

      {!isLoading &&
      (employeesQuery.data?.length ?? 0) ===
        0 ? (
        <Empty description="Сотрудников пока нет" />
      ) : (
        <Table<Employee>
          rowKey="id"
          loading={isLoading}
          dataSource={employeesQuery.data ?? []}
          scroll={{ x: 1900 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
          }}
            expandable={{
              expandedRowRender: (employee) => (
                <Descriptions
                  bordered
                  size="small"
                  column={1}
                  items={[
                    {
                      key: "reason-not-hiring",
                      label: "Причина отказа в найме",
                      children:
                        employee.reason_not_hiring
                          ? hiringRejectionReasonLabels[
                              employee.reason_not_hiring
                            ]
                          : "—",
                    },
                    {
                      key: "reason-delayed-hiring",
                      label: "Причина задержки найма",
                      children:
                        employee.reason_delayed_hiring
                          ? hiringDelayReasonLabels[
                              employee.reason_delayed_hiring
                            ]
                          : "—",
                    },
                    {
                      key: "hiring-comment",
                      label: "Комментарий по найму",
                      children:
                        employee.hiring_comment ?? "—",
                    },
                    {
                      key: "separation-reason",
                      label: "Причина увольнения",
                      children:
                        employee.separation_reason
                          ? separationReasonLabels[
                              employee.separation_reason
                            ]
                          : "—",
                    },
                    {
                      key: "manager-feedback",
                      label:
                        "Комментарий руководителя при увольнении",
                      children:
                        employee
                          .manager_separation_feedback ??
                        "—",
                    },
                  ]}
                />
              ),

              rowExpandable: (employee) =>
                Boolean(
                  employee.reason_not_hiring ||
                    employee.reason_delayed_hiring ||
                    employee.hiring_comment ||
                    employee.separation_reason ||
                    employee.manager_separation_feedback,
                ),
            }}
          columns={[
            {
              title: "ФИО",
              dataIndex: "full_name",
              fixed: "left",
              width: 240,
            },
            {
              title: "Табельный номер",
              dataIndex: "personnel_number",
              width: 150,
              render: (
                value: string | null,
              ) => value ?? "—",
            },
            {
              title: "РЦ",
              dataIndex:
                "distribution_center_division_id",
              width: 210,
              render: (
                centerDivisionId:
                  | number
                  | null,
              ) => {
                if (centerDivisionId === null) {
                  return "—";
                }

                const centerDivision =
                  centerDivisionById.get(
                    centerDivisionId,
                  );

                if (!centerDivision) {
                  return `Назначение #${centerDivisionId}`;
                }

                const center = centerById.get(
                  centerDivision
                    .distribution_center_id,
                );

                return center
                  ? `${center.code} — ${center.name}`
                  : "—";
              },
            },
            {
              title: "Группа",
              dataIndex:
                "distribution_center_division_id",
              width: 220,
              render: (
                centerDivisionId:
                  | number
                  | null,
              ) => {
                const centerDivision =
                  centerDivisionId === null
                    ? undefined
                    : centerDivisionById.get(
                        centerDivisionId,
                      );

                const group =
                  centerDivision?.division
                    .division_group;

                return group
                  ? `${group.abbreviation} — ${group.name}`
                  : "—";
              },
            },
            {
              title: "Подразделение РЦ",
              dataIndex:
                "distribution_center_division_id",
              width: 300,
              render: (
                centerDivisionId:
                  | number
                  | null,
              ) =>
                centerDivisionId === null
                  ? "—"
                  : centerDivisionById.get(
                      centerDivisionId,
                    )?.name ??
                    `Назначение #${centerDivisionId}`,
            },
            {
              title: "Должность",
              dataIndex: "position_id",
              width: 220,
              render: (
                positionId: number | null,
              ) =>
                positionId === null
                  ? "—"
                  : positionById.get(positionId)
                      ?.name ??
                    `Должность #${positionId}`,
            },
            {
              title: "Категория",
              dataIndex: "position_id",
              width: 180,
              render: (
                positionId: number | null,
              ) => {
                const category =
                  positionId === null
                    ? undefined
                    : positionById.get(positionId)
                        ?.category;

                return category ? (
                  <Tag>
                    {
                      positionCategoryLabels[
                        category
                      ]
                    }
                  </Tag>
                ) : (
                  "—"
                );
              },
            },
            {
              title: "Руководитель",
              dataIndex: "manager_id",
              width: 220,
              render: (
                managerId: number | null,
              ) =>
                managerId === null
                  ? "Без руководителя"
                  : employeeById.get(managerId)
                      ?.full_name ??
                    `Сотрудник #${managerId}`,
            },
            {
              title: "Дата приёма",
              dataIndex: "hire_date",
              width: 140,
              render: (
                value: string | null,
              ) =>
                value
                  ? dateFormatter.format(
                      new Date(value),
                    )
                  : "—",
            },
            {
              title: "Тип кандидата",
              dataIndex: "candidate_type",
              width: 180,
              render: (
                candidateType:
                  Employee["candidate_type"],
              ) =>
                candidateTypeLabels[
                  candidateType
                ],
            },
            {
              title: "Дата увольнения",
              dataIndex: "separation_date",
              width: 150,
              render: (
                value: string | null,
              ) =>
                value
                  ? dateFormatter.format(
                      new Date(value),
                    )
                  : "—",
            },
            {
              title: "Действия",
              key: "actions",
              fixed: "right",
              width: 130,
              render: (_, employee) =>
                canUpdate ? (
                  <Button
                    icon={<EditOutlined />}
                    onClick={() =>
                      setEditingEmployee(employee)
                    }
                  >
                    Изменить
                  </Button>
                ) : null,
            },
          ]}
        />
      )}

      {isCreateOpen && (
        <EmployeeFormModal
          employee={null}
          employees={employeesQuery.data ?? []}
          centers={centersQuery.data ?? []}
          onClose={() =>
            setIsCreateOpen(false)
          }
        />
      )}

      {editingEmployee && (
        <EmployeeFormModal
          key={editingEmployee.id}
          employee={editingEmployee}
          employees={employeesQuery.data ?? []}
          centers={centersQuery.data ?? []}
          initialCenterId={findEmployeeCenterId(
            editingEmployee,
          )}
          onClose={() =>
            setEditingEmployee(null)
          }
        />
      )}
    </>
  );
}