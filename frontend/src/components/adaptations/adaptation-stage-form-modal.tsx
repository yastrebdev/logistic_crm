"use client";

import { useEffect } from "react";
import {
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";

import type {
  AdaptationDelayReason,
  AdaptationParticipants,
  AdaptationRiskReason,
  AdaptationStage,
  AdaptationStageUpdate,
  MethodExecutionAdaptation,
  RiskZone,
} from "@/lib/api/adaptations";
import {
  adaptationDelayReasonOptions,
  adaptationMethodOptions,
  adaptationParticipantsOptions,
  adaptationRiskReasonOptions,
  riskZoneOptions,
} from "@/lib/adaptation-labels";

type FormValues = {
  actual_date?: Dayjs | null;
  method?: MethodExecutionAdaptation | null;
  participants?: AdaptationParticipants | null;
  delay_reason?: AdaptationDelayReason | null;
  risk_zone?: RiskZone | null;
  risk_reason?: AdaptationRiskReason | null;
  comment?: string | null;
};

type AdaptationStageFormModalProps = {
  open: boolean;
  stage: AdaptationStage;
  hasNextStage: boolean;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (
    data: AdaptationStageUpdate,
  ) => void;
};

function formatNullableDate(
  value?: Dayjs | null,
): string | null {
  return value
    ? value.format("YYYY-MM-DD")
    : null;
}

export function AdaptationStageFormModal({
  open,
  stage,
  hasNextStage,
  loading = false,
  onCancel,
  onSubmit,
}: AdaptationStageFormModalProps) {
  const [form] = Form.useForm<FormValues>();

  const actualDate = Form.useWatch(
    "actual_date",
    form,
  );

  const selectedRiskZone = Form.useWatch(
    "risk_zone",
    form,
  );

  const isLate =
    actualDate !== null &&
    actualDate !== undefined &&
    actualDate.isAfter(
      dayjs(stage.planned_end_date),
      "day",
    );

  const requiresRiskReason =
    selectedRiskZone === "Yellow" ||
    selectedRiskZone === "Red";

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      actual_date: stage.actual_date
        ? dayjs(stage.actual_date)
        : null,
      method: stage.method,
      participants: stage.participants,
      delay_reason: stage.delay_reason,
      risk_zone: stage.risk_zone,
      risk_reason: stage.risk_reason,
      comment: stage.comment,
    });
  }, [form, open, stage]);

  const handleActualDateChange = (
    value: Dayjs | null,
  ) => {
    if (
      !value ||
      !value.isAfter(
        dayjs(stage.planned_end_date),
        "day",
      )
    ) {
      form.setFieldValue(
        "delay_reason",
        null,
      );
    }
  };

  const handleRiskZoneChange = (
    value: RiskZone | null,
  ) => {
    if (
      value !== "Yellow" &&
      value !== "Red"
    ) {
      form.setFieldValue(
        "risk_reason",
        null,
      );
    }
  };

  const handleFinish = (
    values: FormValues,
  ) => {
    const actualDateValue =
      formatNullableDate(
        values.actual_date,
      );

    const method =
      values.method ?? null;

    const participants =
      values.participants ?? null;

    const delayReason = isLate
      ? (values.delay_reason ?? null)
      : null;

    const riskZone =
      values.risk_zone ?? null;

    const riskReason =
      riskZone === "Yellow" ||
      riskZone === "Red"
        ? (values.risk_reason ?? null)
        : null;

    const trimmedComment =
      values.comment?.trim() ?? "";

    const comment =
      trimmedComment.length > 0
        ? trimmedComment
        : null;

    const request: AdaptationStageUpdate =
      {};

    if (
      actualDateValue !== stage.actual_date
    ) {
      request.actual_date =
        actualDateValue;
    }

    if (method !== stage.method) {
      request.method = method;
    }

    if (
      participants !== stage.participants
    ) {
      request.participants =
        participants;
    }

    if (
      delayReason !== stage.delay_reason
    ) {
      request.delay_reason =
        delayReason;
    }

    if (riskZone !== stage.risk_zone) {
      request.risk_zone = riskZone;
    }

    if (
      riskReason !== stage.risk_reason
    ) {
      request.risk_reason =
        riskReason;
    }

    if (comment !== stage.comment) {
      request.comment = comment;
    }

    onSubmit(request);
  };

  return (
    <Modal
      title={`Редактирование этапа ${stage.stage_number}`}
      open={open}
      confirmLoading={loading}
      okText="Сохранить"
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
          name="actual_date"
          label="Фактическая дата"
          extra={
            hasNextStage
              ? "Дату нельзя очистить после создания следующего этапа"
              : undefined
          }
        >
          <DatePicker
            allowClear={!hasNextStage}
            format="DD.MM.YYYY"
            style={{ width: "100%" }}
            onChange={
              handleActualDateChange
            }
          />
        </Form.Item>

        <Form.Item<FormValues>
          name="method"
          label="Способ проведения"
          dependencies={["actual_date"]}
          rules={[
            {
              validator(_, value) {
                if (actualDate && !value) {
                  return Promise.reject(
                    new Error(
                      "Выберите способ проведения",
                    ),
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <Select
            allowClear
            placeholder="Выберите способ"
            options={
              adaptationMethodOptions
            }
          />
        </Form.Item>

        <Form.Item<FormValues>
          name="participants"
          label="Участники"
          dependencies={["actual_date"]}
          rules={[
            {
              validator(_, value) {
                if (actualDate && !value) {
                  return Promise.reject(
                    new Error(
                      "Выберите участников",
                    ),
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <Select
            allowClear
            placeholder="Выберите участников"
            options={
              adaptationParticipantsOptions
            }
          />
        </Form.Item>

        {isLate && (
          <Form.Item<FormValues>
            name="delay_reason"
            label="Причина задержки"
            rules={[
              {
                required: true,
                message:
                  "Укажите причину задержки",
              },
            ]}
          >
            <Select
              placeholder="Выберите причину"
              options={
                adaptationDelayReasonOptions
              }
            />
          </Form.Item>
        )}

        <Form.Item<FormValues>
          name="risk_zone"
          label="Зона риска"
          dependencies={["actual_date"]}
          rules={[
            {
              validator(_, value) {
                if (actualDate && !value) {
                  return Promise.reject(
                    new Error(
                      "Выберите зону риска",
                    ),
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <Select
            allowClear
            placeholder="Выберите зону"
            options={riskZoneOptions}
            onChange={handleRiskZoneChange}
          />
        </Form.Item>

        {requiresRiskReason && (
          <Form.Item<FormValues>
            name="risk_reason"
            label="Причина риска"
            rules={[
              {
                required: true,
                message:
                  "Укажите причину риска",
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Выберите причину"
              options={
                adaptationRiskReasonOptions
              }
            />
          </Form.Item>
        )}

        <Form.Item<FormValues>
          name="comment"
          label="Комментарий"
          rules={[
            {
              max: 2000,
              message:
                "Комментарий не должен превышать 2000 символов",
            },
          ]}
        >
          <Input.TextArea
            rows={4}
            maxLength={2000}
            showCount
            placeholder="Комментарий по этапу"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}