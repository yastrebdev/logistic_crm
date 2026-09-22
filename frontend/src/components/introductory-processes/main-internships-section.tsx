"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { MainInternshipFormModal } from "./main-internship-form-modal";
import { MentorPaymentCard } from "./mentor-payment-card";
import type { Employee } from "@/lib/api/employees";
import {
  createMainInternship,
  deleteMainInternship,
  updateMainInternship,
  type IntroductoryProcessDetails,
  type MainInternshipCreate,
  type MainInternshipDetails,
  type MainInternshipUpdate,
} from "@/lib/api/introductory-processes";
import { mentorAssignmentStatusLabels } from "@/lib/onboarding-labels";

type MainInternshipsSectionProps = {
  process: IntroductoryProcessDetails;
  employees: Employee[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

type UpdateVariables = {
  internshipId: number;
  data: MainInternshipUpdate;
};

function formatDate(
  value: string | null,
): string {
  return value
    ? dayjs(value).format("DD.MM.YYYY")
    : "—";
}

export function MainInternshipsSection({
  process,
  employees,
  canCreate,
  canUpdate,
  canDelete,
}: MainInternshipsSectionProps) {
  const queryClient = useQueryClient();

  const [messageApi, messageContext] =
    message.useMessage();

  const [modalApi, modalContext] =
    Modal.useModal();

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [
    editingInternship,
    setEditingInternship,
  ] =
    useState<MainInternshipDetails | null>(
      null,
    );

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

  const invalidateDetails = () =>
    queryClient.invalidateQueries({
      queryKey: [
        "introductory-process-details",
        process.id,
      ],
    });

  const createMutation = useMutation({
    mutationFn: createMainInternship,

    onSuccess: async () => {
      await invalidateDetails();

      setIsCreateOpen(false);

      messageApi.success(
        "Основная стажировка добавлена",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      internshipId,
      data,
    }: UpdateVariables) =>
      updateMainInternship(
        internshipId,
        data,
      ),

    onSuccess: async () => {
      await invalidateDetails();

      setEditingInternship(null);

      messageApi.success(
        "Основная стажировка обновлена",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMainInternship,

    onSuccess: async () => {
      await invalidateDetails();

      messageApi.success(
        "Основная стажировка удалена",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const handleSubmit = (
    data:
      | MainInternshipCreate
      | MainInternshipUpdate,
  ) => {
    if (!editingInternship) {
      createMutation.mutate(
        data as MainInternshipCreate,
      );

      return;
    }

    const updateData =
      data as MainInternshipUpdate;

    if (
      Object.keys(updateData).length === 0
    ) {
      setEditingInternship(null);
      return;
    }

    updateMutation.mutate({
      internshipId:
        editingInternship.id,
      data: updateData,
    });
  };

  const handleDelete = (
    internship: MainInternshipDetails,
  ) => {
    modalApi.confirm({
      title: "Удалить основную стажировку?",
      content: internship.mentor_payment
        ? "У этой стажировки есть выплата наставнику. Backend не позволит её удалить."
        : "Запись основной стажировки будет удалена.",
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",

      onOk: () =>
        deleteMutation.mutateAsync(
          internship.id,
        ),
    });
  };

  const columns: ColumnsType<MainInternshipDetails> =
    [
      {
        title: "Статус наставника",
        dataIndex:
          "mentor_assignment_status",
        width: 230,

        render: (
          status: MainInternshipDetails["mentor_assignment_status"],
        ) => (
          <Tag>
            {
              mentorAssignmentStatusLabels[
                status
              ]
            }
          </Tag>
        ),
      },
      {
        title: "Наставник",
        dataIndex: "mentor_id",
        width: 280,

        render: (
          mentorId: number | null,
        ) => {
          if (mentorId === null) {
            return "—";
          }

          const mentor =
            employeeById.get(mentorId);

          if (!mentor) {
            return `Сотрудник #${mentorId}`;
          }

          return mentor.personnel_number
            ? `${mentor.full_name} — ${mentor.personnel_number}`
            : mentor.full_name;
        },
      },
      {
        title: "Дата начала",
        dataIndex: "start_date",
        width: 140,

        render: (value: string) =>
          formatDate(value),
      },
      {
        title: "Дата окончания",
        dataIndex: "end_date",
        width: 150,

        render: (value: string | null) =>
          formatDate(value),
      },
      {
        title: "Фактическая длительность",
        dataIndex: "actual_duration_days",
        width: 190,

        render: (value: number | null) =>
          value === null
            ? "В процессе"
            : `${value} дн.`,
      },
      {
        title: "Выплата",
        dataIndex: "mentor_payment",
        width: 160,

        render: (
          payment: MainInternshipDetails["mentor_payment"],
        ) =>
          payment ? (
            <Tag color="blue">
              Создана
            </Tag>
          ) : (
            <Tag>Не создана</Tag>
          ),
      },
      {
        title: "Действия",
        key: "actions",
        width: 130,
        align: "right",

        render: (_, internship) => (
          <Space size="small">
            {canUpdate && (
              <Tooltip title="Изменить">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() =>
                    setEditingInternship(
                      internship,
                    )
                  }
                />
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip
                title={
                  internship.mentor_payment
                    ? "Нельзя удалить стажировку с выплатой"
                    : "Удалить"
                }
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={
                    internship.mentor_payment !==
                    null
                  }
                  loading={
                    deleteMutation.isPending &&
                    deleteMutation.variables ===
                      internship.id
                  }
                  onClick={() =>
                    handleDelete(internship)
                  }
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ];

  return (
    <>
      {messageContext}
      {modalContext}

      <Card
        title="Основная стажировка"
        extra={
          canCreate ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                setIsCreateOpen(true)
              }
            >
              Добавить
            </Button>
          ) : null
        }
      >
        {process.main_internships.length ===
        0 ? (
          <Typography.Text type="secondary">
            Основных стажировок пока нет
          </Typography.Text>
        ) : (
          <Table<MainInternshipDetails>
            rowKey="id"
            size="small"
            pagination={false}
            columns={columns}
            dataSource={
              process.main_internships
            }
            scroll={{ x: 1350 }}
            expandable={{
              expandedRowRender: (
                internship,
              ) => (
                <MentorPaymentCard
                  processId={process.id}
                  internship={internship}
                  canCreate={canCreate}
                  canUpdate={canUpdate}
                />
              ),
              expandRowByClick: false,
            }}
          />
        )}
      </Card>

      <MainInternshipFormModal
        open={
          isCreateOpen ||
          editingInternship !== null
        }
        process={process}
        internship={editingInternship}
        employees={employees}
        loading={
          createMutation.isPending ||
          updateMutation.isPending
        }
        onCancel={() => {
          setIsCreateOpen(false);
          setEditingInternship(null);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}