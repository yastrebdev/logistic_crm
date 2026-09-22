"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { IntroductoryProcessFormModal } from "@/components/introductory-processes/introductory-process-form-modal";
import { ProcessDetailsDrawer } from "@/components/introductory-processes/process-details-drawer";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  createIntroductoryProcess,
  deleteIntroductoryProcess,
  getIntroductoryProcesses,
  updateIntroductoryProcess,
  type IntroductoryProcess,
  type IntroductoryProcessCreate,
  type IntroductoryProcessUpdate,
} from "@/lib/api/introductory-processes";
import { getEmployees } from "@/lib/api/employees";
import {
  getAllUsers,
  USER_TYPE_LABELS,
} from "@/lib/api/users";
import { hasPermission } from "@/lib/permissions";

type UpdateVariables = {
  processId: number;
  data: IntroductoryProcessUpdate;
};

export default function IntroductoryProcessesPage() {
  const queryClient = useQueryClient();

  const [messageApi, messageContext] =
    message.useMessage();

  const [modalApi, modalContext] =
    Modal.useModal();

    const [
        selectedProcessId,
        setSelectedProcessId,
    ] = useState<number | null>(null);

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState<number | undefined>();

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [editingProcess, setEditingProcess] =
    useState<IntroductoryProcess | null>(null);

  const { data: currentUser } = useCurrentUser();

  const canRead =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "onboarding.read",
    );

  const canCreate =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "onboarding.create",
    );

  const canUpdate =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "onboarding.update",
    );

  const canDelete =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "onboarding.delete",
    );

  const processesQuery = useQuery({
    queryKey: [
      "introductory-processes",
      selectedEmployeeId ?? null,
    ],
    queryFn: () =>
        getIntroductoryProcesses({
          employeeId: selectedEmployeeId,
        }),
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

  const userById = useMemo(
    () =>
      new Map(
        (usersQuery.data ?? []).map(
          (user) => [user.id, user],
        ),
      ),
    [usersQuery.data],
  );

  const invalidateProcesses = () =>
    queryClient.invalidateQueries({
      queryKey: ["introductory-processes"],
    });

  const createMutation = useMutation({
    mutationFn: createIntroductoryProcess,

    onSuccess: async () => {
      await invalidateProcesses();

      setIsCreateOpen(false);

      messageApi.success(
        "Вводный процесс создан",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

const updateMutation = useMutation({
  mutationFn: ({
    processId,
    data,
  }: UpdateVariables) =>
    updateIntroductoryProcess(
      processId,
      data,
    ),

  onSuccess: async (
    _updatedProcess,
    variables,
  ) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "introductory-processes",
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "introductory-process-details",
          variables.processId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "adaptation-by-introductory-process",
          variables.processId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: ["adaptations"],
      }),
    ]);

    setEditingProcess(null);

    messageApi.success(
      variables.data.end_date
        ? "Вводный процесс завершён"
        : "Вводный процесс обновлён",
    );
  },

  onError: (error: Error) => {
    messageApi.error(error.message);
  },
});

  const deleteMutation = useMutation({
    mutationFn: deleteIntroductoryProcess,

    onSuccess: async () => {
      await invalidateProcesses();

      messageApi.success(
        "Вводный процесс удалён",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const handleSubmit = (
    data:
      | IntroductoryProcessCreate
      | IntroductoryProcessUpdate,
  ) => {
    if (!editingProcess) {
      createMutation.mutate(
        data as IntroductoryProcessCreate,
      );

      return;
    }

    const updateData =
      data as IntroductoryProcessUpdate;

    if (
      Object.keys(updateData).length === 0
    ) {
      setEditingProcess(null);
      return;
    }

    updateMutation.mutate({
      processId: editingProcess.id,
      data: updateData,
    });
  };

  const handleComplete = (
    process: IntroductoryProcess,
  ) => {
    updateMutation.mutate({
      processId: process.id,
      data: {
        end_date: dayjs().format(
          "YYYY-MM-DD",
        ),
      },
    });
  };

  const handleDelete = (
    process: IntroductoryProcess,
  ) => {
    const employee = employeeById.get(
      process.employee_id,
    );

    modalApi.confirm({
      title: "Удалить вводный процесс?",
      content: employee
        ? `Сотрудник: ${employee.full_name}`
        : "Подтвердите удаление процесса",
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",

      onOk: () =>
        deleteMutation.mutateAsync(process.id),
    });
  };

  const columns: ColumnsType<IntroductoryProcess> =
    [
      {
        title: "Сотрудник",
        dataIndex: "employee_id",
        width: 260,

        render: (employeeId: number) =>
          employeeById.get(employeeId)
            ?.full_name ??
          `Сотрудник #${employeeId}`,
      },
      {
        title: "Табельный номер",
        dataIndex: "employee_id",
        width: 160,

        render: (employeeId: number) =>
          employeeById.get(employeeId)
            ?.personnel_number ?? "—",
      },
      {
        title: "Ответственный",
        dataIndex: "tutor_id",
        width: 300,

        render: (tutorId: number) => {
          const tutor =
            userById.get(tutorId);

          if (!tutor) {
            return `Пользователь #${tutorId}`;
          }

          return (
            <Space orientation="vertical" size={0}>
              <Typography.Text>
                {tutor.email}
              </Typography.Text>

              <Typography.Text
                type="secondary"
                style={{ fontSize: 12 }}
              >
                {
                  USER_TYPE_LABELS[
                    tutor.user_type
                  ]
                }
              </Typography.Text>
            </Space>
          );
        },
      },
      {
        title: "Дата начала",
        dataIndex: "start_date",
        width: 140,

        render: (value: string) =>
          dayjs(value).format("DD.MM.YYYY"),
      },
      {
        title: "Дата окончания",
        dataIndex: "end_date",
        width: 150,

        render: (value: string | null) =>
          value
            ? dayjs(value).format(
                "DD.MM.YYYY",
              )
            : "—",
      },
      {
        title: "Состояние",
        dataIndex: "end_date",
        width: 130,

        render: (endDate: string | null) =>
          endDate === null ? (
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
        title: "Действия",
        key: "actions",
        width: 220,
        fixed: "right",

        render: (_, process) => (
          <Space size="small">
            <Tooltip title="Открыть процесс">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() =>
                  setSelectedProcessId(process.id)
                }
              />
            </Tooltip>
            {canUpdate &&
              process.end_date === null && (
                <Tooltip title="Завершить сегодня">
                  <Button
                    type="text"
                    icon={<CheckOutlined />}
                    onClick={() =>
                      handleComplete(process)
                    }
                  />
                </Tooltip>
              )}

            {canUpdate && (
              <Tooltip title="Изменить">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() =>
                    setEditingProcess(
                      process,
                    )
                  }
                />
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip title="Удалить">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    handleDelete(process)
                  }
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ];

  const error =
    processesQuery.error ||
    employeesQuery.error ||
    usersQuery.error;

  const isLoading =
    processesQuery.isLoading ||
    employeesQuery.isLoading ||
    usersQuery.isLoading;

  if (
    currentUser !== undefined &&
    !canRead
  ) {
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
        title="Не удалось загрузить вводные процессы"
        description={error.message}
        showIcon
      />
    );
  }

  return (
    <>
      {messageContext}
      {modalContext}

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
            Вводные процессы
          </Typography.Title>

          <Typography.Text type="secondary">
            Вводное обучение сотрудников
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
            Создать вводный процесс
          </Button>
        )}
      </Space>

      <Select
        allowClear
        showSearch
        value={selectedEmployeeId}
        placeholder="Фильтр по сотруднику"
        optionFilterProp="label"
        style={{
          width: 380,
          marginBottom: 24,
        }}
        options={(
          employeesQuery.data ?? []
        ).map((employee) => ({
          value: employee.id,
          label: employee.personnel_number
            ? `${employee.full_name} — ${employee.personnel_number}`
            : employee.full_name,
        }))}
        onChange={setSelectedEmployeeId}
      />

      <Table<IntroductoryProcess>
        rowKey="id"
        loading={isLoading}
        dataSource={processesQuery.data ?? []}
        columns={columns}
        scroll={{ x: 1350 }}
        locale={{
          emptyText:
            "Вводных процессов пока нет",
        }}
        pagination={{
          pageSize: 20,
          showSizeChanger: false,
        }}
      />

<IntroductoryProcessFormModal
  open={
    isCreateOpen ||
    editingProcess !== null
  }
  process={editingProcess}
  employees={employeesQuery.data ?? []}
  users={usersQuery.data ?? []}
  loading={
    createMutation.isPending ||
    updateMutation.isPending
  }
  onCancel={() => {
    setIsCreateOpen(false);
    setEditingProcess(null);
  }}
  onSubmit={handleSubmit}
/>

<ProcessDetailsDrawer
  open={selectedProcessId !== null}
  processId={selectedProcessId}
  employees={employeesQuery.data ?? []}
  users={usersQuery.data ?? []}
  canCreate={canCreate}
  canUpdate={canUpdate}
  canDelete={canDelete}
  onClose={() =>
    setSelectedProcessId(null)
  }
/>
</>
);
}