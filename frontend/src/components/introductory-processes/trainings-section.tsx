"use client";

import { useState } from "react";
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

import { TrainingFormModal } from "./training-form-modal";
import {
  createTraining,
  deleteTraining,
  updateTraining,
  type Training,
  type TrainingCreate,
  type TrainingUpdate,
  type IntroductoryProcessDetails,
} from "@/lib/api/introductory-processes";
import { admissionFormatLabels } from "@/lib/onboarding-labels";

type TrainingsSectionProps = {
  process: IntroductoryProcessDetails;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

type UpdateVariables = {
  trainingId: number;
  data: TrainingUpdate;
};

export function TrainingsSection({
  process,
  canCreate,
  canUpdate,
  canDelete,
}: TrainingsSectionProps) {
  const queryClient = useQueryClient();

  const [messageApi, messageContext] =
    message.useMessage();

  const [modalApi, modalContext] =
    Modal.useModal();

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [editingTraining, setEditingTraining] =
    useState<Training | null>(null);

  const invalidateDetails = () =>
    queryClient.invalidateQueries({
      queryKey: [
        "introductory-process-details",
        process.id,
      ],
    });

  const createMutation = useMutation({
    mutationFn: createTraining,

    onSuccess: async () => {
      await invalidateDetails();

      setIsCreateOpen(false);

      messageApi.success(
        "Обучение добавлено",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      trainingId,
      data,
    }: UpdateVariables) =>
      updateTraining(trainingId, data),

    onSuccess: async () => {
      await invalidateDetails();

      setEditingTraining(null);

      messageApi.success(
        "Обучение обновлено",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTraining,

    onSuccess: async () => {
      await invalidateDetails();

      messageApi.success(
        "Обучение удалено",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const handleSubmit = (
    data: TrainingCreate | TrainingUpdate,
  ) => {
    if (!editingTraining) {
      createMutation.mutate(
        data as TrainingCreate,
      );

      return;
    }

    const updateData = data as TrainingUpdate;

    if (
      Object.keys(updateData).length === 0
    ) {
      setEditingTraining(null);
      return;
    }

    updateMutation.mutate({
      trainingId: editingTraining.id,
      data: updateData,
    });
  };

  const handleDelete = (
    training: Training,
  ) => {
    modalApi.confirm({
      title: "Удалить обучение?",
      content:
        "Запись об обучении и тестировании будет удалена.",
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",

      onOk: () =>
        deleteMutation.mutateAsync(
          training.id,
        ),
    });
  };

  const columns: ColumnsType<Training> = [
    {
      title: "Дата обучения",
      dataIndex: "training_date",
      width: 150,

      render: (value: string | null) =>
        value
          ? dayjs(value).format("DD.MM.YYYY")
          : "—",
    },
    {
      title: "Форма допуска",
      dataIndex: "admission_format",
      width: 230,

      render: (
        value: Training["admission_format"],
      ) => admissionFormatLabels[value],
    },
    {
      title: "Дата тестирования",
      dataIndex: "test_date",
      width: 170,

      render: (value: string | null) =>
        value
          ? dayjs(value).format("DD.MM.YYYY")
          : "—",
    },
    {
      title: "Результат",
      dataIndex: "test_result",
      width: 120,
      align: "center",

      render: (value: number | null) =>
        value === null ? "—" : value,
    },
    {
      title: "Действия",
      key: "actions",
      width: 130,
      align: "right",

      render: (_, training) => (
        <Space size="small">
          {canUpdate && (
            <Tooltip title="Изменить">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() =>
                  setEditingTraining(training)
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
                    training.id
                }
                onClick={() =>
                  handleDelete(training)
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
        title="Обучения и тестирование"
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
        {process.trainings.length === 0 ? (
          <Typography.Text type="secondary">
            Обучений пока нет
          </Typography.Text>
        ) : (
          <Table<Training>
            rowKey="id"
            size="small"
            pagination={false}
            columns={columns}
            dataSource={process.trainings}
          />
        )}
      </Card>

      <TrainingFormModal
        open={
          isCreateOpen ||
          editingTraining !== null
        }
        process={process}
        training={editingTraining}
        loading={
          createMutation.isPending ||
          updateMutation.isPending
        }
        onCancel={() => {
          setIsCreateOpen(false);
          setEditingTraining(null);
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}