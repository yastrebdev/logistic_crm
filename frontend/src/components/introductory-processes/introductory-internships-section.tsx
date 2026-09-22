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
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { IntroductoryInternshipFormModal } from "./introductory-internship-form-modal";
import type { Employee } from "@/lib/api/employees";
import {
  createIntroductoryInternship,
  deleteIntroductoryInternship,
  updateIntroductoryInternship,
  type IntroductoryInternship,
  type IntroductoryInternshipCreate,
  type IntroductoryInternshipUpdate,
  type IntroductoryProcessDetails,
} from "@/lib/api/introductory-processes";

type IntroductoryInternshipsSectionProps = {
  process: IntroductoryProcessDetails;
  employees: Employee[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

type UpdateVariables = {
  internshipId: number;
  data: IntroductoryInternshipUpdate;
};

export function IntroductoryInternshipsSection({
  process,
  employees,
  canCreate,
  canUpdate,
  canDelete,
}: IntroductoryInternshipsSectionProps) {
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
    useState<IntroductoryInternship | null>(
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
    mutationFn:
      createIntroductoryInternship,

    onSuccess: async () => {
      await invalidateDetails();

      setIsCreateOpen(false);

      messageApi.success(
        "Вводная стажировка добавлена",
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
      updateIntroductoryInternship(
        internshipId,
        data,
      ),

    onSuccess: async () => {
      await invalidateDetails();

      setEditingInternship(null);

      messageApi.success(
        "Вводная стажировка обновлена",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn:
      deleteIntroductoryInternship,

    onSuccess: async () => {
      await invalidateDetails();

      messageApi.success(
        "Вводная стажировка удалена",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const handleSubmit = (
    data:
      | IntroductoryInternshipCreate
      | IntroductoryInternshipUpdate,
  ) => {
    if (!editingInternship) {
      createMutation.mutate(
        data as IntroductoryInternshipCreate,
      );

      return;
    }

    const updateData =
      data as IntroductoryInternshipUpdate;

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
    internship: IntroductoryInternship,
  ) => {
    const mentor = employeeById.get(
      internship.mentor_id,
    );

    modalApi.confirm({
      title: "Удалить вводную стажировку?",
      content: mentor
        ? `Наставник: ${mentor.full_name}`
        : "Подтвердите удаление стажировки",
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",

      onOk: () =>
        deleteMutation.mutateAsync(
          internship.id,
        ),
    });
  };

  const columns: ColumnsType<IntroductoryInternship> =
    [
      {
        title: "Дата",
        dataIndex: "internship_date",
        width: 160,

        render: (value: string) =>
          dayjs(value).format("DD.MM.YYYY"),
      },
      {
        title: "Наставник",
        dataIndex: "mentor_id",

        render: (mentorId: number) => {
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
              <Tooltip title="Удалить">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
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
        title="Вводные стажировки"
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
        {process.introductory_internships
          .length === 0 ? (
          <Typography.Text type="secondary">
            Вводных стажировок пока нет
          </Typography.Text>
        ) : (
          <Table<IntroductoryInternship>
            rowKey="id"
            size="small"
            pagination={false}
            columns={columns}
            dataSource={
              process.introductory_internships
            }
          />
        )}
      </Card>

      <IntroductoryInternshipFormModal
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