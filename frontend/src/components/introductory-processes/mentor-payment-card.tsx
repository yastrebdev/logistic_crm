"use client";

import { useState } from "react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  message,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";

import { MentorPaymentFormModal } from "./mentor-payment-form-modal";
import {
  createMentorPayment,
  updateMentorPayment,
  type MainInternshipDetails,
  type MentorPaymentCreate,
  type MentorPaymentUpdate,
} from "@/lib/api/introductory-processes";
import {
  nonPaymentReasonLabels,
  paymentStatusColors,
  paymentStatusLabels,
} from "@/lib/onboarding-labels";

type MentorPaymentCardProps = {
  processId: number;
  internship: MainInternshipDetails;
  canCreate: boolean;
  canUpdate: boolean;
};

type UpdateVariables = {
  paymentId: number;
  data: MentorPaymentUpdate;
};

const currencyFormatter =
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
  });

function formatDate(
  value: string | null,
): string {
  return value
    ? dayjs(value).format("DD.MM.YYYY")
    : "—";
}

function formatAmount(
  value: string | null,
): string {
  if (value === null) {
    return "—";
  }

  const amount = Number(value);

  return Number.isFinite(amount)
    ? currencyFormatter.format(amount)
    : value;
}

export function MentorPaymentCard({
  processId,
  internship,
  canCreate,
  canUpdate,
}: MentorPaymentCardProps) {
  const queryClient = useQueryClient();

  const [messageApi, messageContext] =
    message.useMessage();

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const payment = internship.mentor_payment;

  const invalidateDetails = () =>
    queryClient.invalidateQueries({
      queryKey: [
        "introductory-process-details",
        processId,
      ],
    });

  const createMutation = useMutation({
    mutationFn: createMentorPayment,

    onSuccess: async () => {
      await invalidateDetails();

      setIsModalOpen(false);

      messageApi.success(
        "Выплата наставнику создана",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      paymentId,
      data,
    }: UpdateVariables) =>
      updateMentorPayment(
        paymentId,
        data,
      ),

    onSuccess: async () => {
      await invalidateDetails();

      setIsModalOpen(false);

      messageApi.success(
        "Выплата наставнику обновлена",
      );
    },

    onError: (error: Error) => {
      messageApi.error(error.message);
    },
  });

  const handleSubmit = (
    data:
      | MentorPaymentCreate
      | MentorPaymentUpdate,
  ) => {
    if (!payment) {
      createMutation.mutate(
        data as MentorPaymentCreate,
      );

      return;
    }

    const updateData =
      data as MentorPaymentUpdate;

    if (
      Object.keys(updateData).length === 0
    ) {
      setIsModalOpen(false);
      return;
    }

    updateMutation.mutate({
      paymentId: payment.id,
      data: updateData,
    });
  };

  const canCreatePayment =
    canCreate &&
    internship.mentor_assignment_status ===
      "Mentor is assigned" &&
    internship.mentor_id !== null;

  return (
    <>
      {messageContext}

      <Card
        type="inner"
        title="Выплата наставнику"
        extra={
          payment && canUpdate ? (
            <Button
              icon={<EditOutlined />}
              onClick={() =>
                setIsModalOpen(true)
              }
            >
              Изменить
            </Button>
          ) : null
        }
      >
        {payment ? (
          <Descriptions
            bordered
            size="small"
            column={1}
            items={[
              {
                key: "form-completed",
                label:
                  "Форма стажировки заполнена",
                children:
                  payment.internship_form_completed
                    ? "Да"
                    : "Нет",
              },
              {
                key: "created-at",
                label:
                  "Дата создания выплаты",
                children: formatDate(
                  payment.payment_created_at,
                ),
              },
              {
                key: "amount",
                label: "Сумма",
                children: formatAmount(
                  payment.amount,
                ),
              },
              {
                key: "status",
                label: "Статус",
                children: (
                  <Tag
                    color={
                      paymentStatusColors[
                        payment.payment_status
                      ]
                    }
                  >
                    {
                      paymentStatusLabels[
                        payment.payment_status
                      ]
                    }
                  </Tag>
                ),
              },
              {
                key: "paid-at",
                label: "Дата выплаты",
                children: formatDate(
                  payment.paid_at,
                ),
              },
              {
                key: "reason",
                label: "Причина неоплаты",
                children:
                  payment.non_payment_reason
                    ? nonPaymentReasonLabels[
                        payment
                          .non_payment_reason
                      ]
                    : "—",
              },
            ]}
          />
        ) : (
          <Space
            direction="vertical"
            size="middle"
          >
            <Typography.Text type="secondary">
              Выплата для этой стажировки
              ещё не создана
            </Typography.Text>

            {canCreatePayment ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  setIsModalOpen(true)
                }
              >
                Создать выплату
              </Button>
            ) : (
              <Typography.Text type="secondary">
                Создать выплату можно только
                для стажировки с назначенным
                наставником
              </Typography.Text>
            )}
          </Space>
        )}
      </Card>

      <MentorPaymentFormModal
        open={isModalOpen}
        internship={internship}
        payment={payment}
        loading={
          createMutation.isPending ||
          updateMutation.isPending
        }
        onCancel={() =>
          setIsModalOpen(false)
        }
        onSubmit={handleSubmit}
      />
    </>
  );
}