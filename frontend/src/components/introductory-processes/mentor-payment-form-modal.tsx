"use client";

import { useEffect } from "react";
import {
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Select,
  Switch,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";

import type {
  MainInternshipDetails,
  MentorPayment,
  MentorPaymentCreate,
  MentorPaymentUpdate,
  PaymentStatus,
} from "@/lib/api/introductory-processes";
import {
  nonPaymentReasonOptions,
  paymentStatusOptions,
} from "@/lib/onboarding-labels";

type FormValues = {
  internship_form_completed: boolean;
  payment_created_at?: Dayjs | null;
  amount?: string | null;
  payment_status: PaymentStatus;
  paid_at?: Dayjs | null;
  non_payment_reason?:
    | MentorPayment["non_payment_reason"];
};

type MentorPaymentFormModalProps = {
  open: boolean;
  internship: MainInternshipDetails;
  payment: MentorPayment | null;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (
    data:
      | MentorPaymentCreate
      | MentorPaymentUpdate,
  ) => void;
};

function formatNullableDate(
  value?: Dayjs | null,
): string | null {
  return value
    ? value.format("YYYY-MM-DD")
    : null;
}

export function MentorPaymentFormModal({
  open,
  internship,
  payment,
  loading = false,
  onCancel,
  onSubmit,
}: MentorPaymentFormModalProps) {
  const [form] = Form.useForm<FormValues>();

  const selectedStatus = Form.useWatch(
    "payment_status",
    form,
  );

  const isEditing = payment !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (payment) {
      form.setFieldsValue({
        internship_form_completed:
          payment.internship_form_completed,
        payment_created_at:
          payment.payment_created_at
            ? dayjs(
                payment.payment_created_at,
              )
            : null,
        amount: payment.amount,
        payment_status:
          payment.payment_status,
        paid_at: payment.paid_at
          ? dayjs(payment.paid_at)
          : null,
        non_payment_reason:
          payment.non_payment_reason,
      });

      return;
    }

    form.setFieldsValue({
      internship_form_completed: false,
      payment_created_at: dayjs(),
      amount: null,
      payment_status: "Pending",
      paid_at: null,
      non_payment_reason: null,
    });
  }, [form, open, payment]);

  const handleStatusChange = (
    status: PaymentStatus,
  ) => {
    if (status === "Paid") {
      form.setFieldValue(
        "non_payment_reason",
        null,
      );

      return;
    }

    if (status === "Cancelled") {
      form.setFieldValue(
        "paid_at",
        null,
      );

      return;
    }

    form.setFieldsValue({
      paid_at: null,
      non_payment_reason: null,
    });
  };

  const disabledPaidDate = (
    current: Dayjs,
  ): boolean => {
    const createdAt =
      form.getFieldValue(
        "payment_created_at",
      );

    if (!createdAt) {
      return false;
    }

    return current
      .startOf("day")
      .isBefore(createdAt.startOf("day"));
  };

  const handleFinish = (
    values: FormValues,
  ) => {
    const paymentCreatedAt =
      formatNullableDate(
        values.payment_created_at,
      );

    const amount =
      values.amount === undefined ||
      values.amount === null ||
      values.amount === ""
        ? null
        : String(values.amount);

    const paidAt =
      values.payment_status === "Paid"
        ? formatNullableDate(values.paid_at)
        : null;

    const nonPaymentReason =
      values.payment_status === "Cancelled"
        ? (values.non_payment_reason ??
          null)
        : null;

    if (!payment) {
      const request: MentorPaymentCreate = {
        main_internship_id:
          internship.id,
        internship_form_completed:
          values.internship_form_completed,
        payment_created_at:
          paymentCreatedAt,
        amount,
        payment_status:
          values.payment_status,
        paid_at: paidAt,
        non_payment_reason:
          nonPaymentReason,
      };

      onSubmit(request);
      return;
    }

    const request: MentorPaymentUpdate = {};

    if (
      values.internship_form_completed !==
      payment.internship_form_completed
    ) {
      request.internship_form_completed =
        values.internship_form_completed;
    }

    if (
      paymentCreatedAt !==
      payment.payment_created_at
    ) {
      request.payment_created_at =
        paymentCreatedAt;
    }

    if (amount !== payment.amount) {
      request.amount = amount;
    }

    if (
      values.payment_status !==
      payment.payment_status
    ) {
      request.payment_status =
        values.payment_status;
    }

    if (paidAt !== payment.paid_at) {
      request.paid_at = paidAt;
    }

    if (
      nonPaymentReason !==
      payment.non_payment_reason
    ) {
      request.non_payment_reason =
        nonPaymentReason;
    }

    onSubmit(request);
  };

  return (
    <Modal
      title={
        isEditing
          ? "Редактирование выплаты"
          : "Создание выплаты наставнику"
      }
      open={open}
      confirmLoading={loading}
      okText={
        isEditing ? "Сохранить" : "Создать"
      }
      cancelText="Отмена"
      destroyOnHidden
      onCancel={onCancel}
      onOk={() => form.submit()}
      afterClose={() =>
        form.resetFields()
      }
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item<FormValues>
          name="internship_form_completed"
          label="Форма стажировки заполнена"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item<FormValues>
          name="payment_created_at"
          label="Дата создания выплаты"
        >
          <DatePicker
            allowClear
            format="DD.MM.YYYY"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item<FormValues>
          name="amount"
          label="Сумма"
          dependencies={[
            "payment_status",
          ]}
          rules={[
            {
              validator(_, value) {
                if (
                  selectedStatus ===
                    "Paid" &&
                  (value === null ||
                    value === undefined ||
                    value === "")
                ) {
                  return Promise.reject(
                    new Error(
                      "Укажите сумму выплаты",
                    ),
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber<string>
            stringMode
            min="0"
            precision={2}
            decimalSeparator=","
            placeholder="0,00"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item<FormValues>
          name="payment_status"
          label="Статус выплаты"
          rules={[
            {
              required: true,
              message:
                "Выберите статус выплаты",
            },
          ]}
        >
          <Select
            options={paymentStatusOptions}
            onChange={handleStatusChange}
          />
        </Form.Item>

        {selectedStatus === "Paid" && (
          <Form.Item<FormValues>
            name="paid_at"
            label="Дата выплаты"
            dependencies={[
              "payment_created_at",
              "internship_form_completed",
            ]}
            rules={[
              {
                required: true,
                message:
                  "Укажите дату выплаты",
              },
              ({ getFieldValue }) => ({
                validator(_, value: Dayjs | null) {
                  const formCompleted =
                    getFieldValue(
                      "internship_form_completed",
                    ) as boolean;

                  if (
                    value &&
                    !formCompleted
                  ) {
                    return Promise.reject(
                      new Error(
                        "Сначала отметьте заполнение формы стажировки",
                      ),
                    );
                  }

                  const createdAt =
                    getFieldValue(
                      "payment_created_at",
                    ) as Dayjs | null;

                  if (
                    value &&
                    createdAt &&
                    value.isBefore(
                      createdAt,
                      "day",
                    )
                  ) {
                    return Promise.reject(
                      new Error(
                        "Дата выплаты не может быть раньше даты создания",
                      ),
                    );
                  }

                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker
              format="DD.MM.YYYY"
              disabledDate={disabledPaidDate}
              style={{ width: "100%" }}
            />
          </Form.Item>
        )}

        {selectedStatus === "Cancelled" && (
          <Form.Item<FormValues>
            name="non_payment_reason"
            label="Причина неоплаты"
            rules={[
              {
                required: true,
                message:
                  "Выберите причину неоплаты",
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Выберите причину"
              options={
                nonPaymentReasonOptions
              }
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}