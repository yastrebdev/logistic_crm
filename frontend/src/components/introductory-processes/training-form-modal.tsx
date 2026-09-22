"use client";

import { useEffect } from "react";
import {
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Select,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";

import type {
  IntroductoryProcess,
  Training,
  TrainingCreate,
  TrainingUpdate,
} from "@/lib/api/introductory-processes";
import { admissionFormatOptions } from "@/lib/onboarding-labels";

type FormValues = {
  training_date?: Dayjs | null;
  admission_format:
    Training["admission_format"];
  test_date?: Dayjs | null;
  test_result?: number | null;
};

type TrainingFormModalProps = {
  open: boolean;
  process: IntroductoryProcess;
  training: Training | null;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (
    data: TrainingCreate | TrainingUpdate,
  ) => void;
};

function formatNullableDate(
  value?: Dayjs | null,
): string | null {
  return value
    ? value.format("YYYY-MM-DD")
    : null;
}

export function TrainingFormModal({
  open,
  process,
  training,
  loading = false,
  onCancel,
  onSubmit,
}: TrainingFormModalProps) {
  const [form] = Form.useForm<FormValues>();

  const isEditing = training !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (training) {
      form.setFieldsValue({
        training_date: training.training_date
          ? dayjs(training.training_date)
          : null,
        admission_format:
          training.admission_format,
        test_date: training.test_date
          ? dayjs(training.test_date)
          : null,
        test_result:
          training.test_result,
      });

      return;
    }

    form.setFieldsValue({
      training_date: null,
      admission_format:
        "The test is on the form",
      test_date: null,
      test_result: null,
    });
  }, [form, open, training]);

  const disabledProcessDate = (
    current: Dayjs,
  ): boolean => {
    const processStart = dayjs(
      process.start_date,
    ).startOf("day");

    if (
      current.startOf("day").isBefore(
        processStart,
      )
    ) {
      return true;
    }

    if (!process.end_date) {
      return false;
    }

    const processEnd = dayjs(
      process.end_date,
    ).endOf("day");

    return current
      .endOf("day")
      .isAfter(processEnd);
  };

  const disabledTestDate = (
    current: Dayjs,
  ): boolean => {
    if (disabledProcessDate(current)) {
      return true;
    }

    const trainingDate =
      form.getFieldValue("training_date");

    if (!trainingDate) {
      return false;
    }

    return current
      .startOf("day")
      .isBefore(
        trainingDate.startOf("day"),
      );
  };

  const handleFinish = (
    values: FormValues,
  ) => {
    const trainingDate =
      formatNullableDate(
        values.training_date,
      );

    const testDate =
      formatNullableDate(values.test_date);

    const testResult =
      values.test_result ?? null;

    if (!training) {
      const request: TrainingCreate = {
        introductory_process_id:
          process.id,
        admission_format:
          values.admission_format,
      };

      if (trainingDate !== null) {
        request.training_date =
          trainingDate;
      }

      if (testDate !== null) {
        request.test_date = testDate;
      }

      if (testResult !== null) {
        request.test_result = testResult;
      }

      onSubmit(request);
      return;
    }

    const request: TrainingUpdate = {};

    if (
      trainingDate !==
      training.training_date
    ) {
      request.training_date =
        trainingDate;
    }

    if (
      values.admission_format !==
      training.admission_format
    ) {
      request.admission_format =
        values.admission_format;
    }

    if (testDate !== training.test_date) {
      request.test_date = testDate;
    }

    if (
      testResult !== training.test_result
    ) {
      request.test_result = testResult;
    }

    onSubmit(request);
  };

  return (
    <Modal
      title={
        isEditing
          ? "Редактирование обучения"
          : "Добавление обучения"
      }
      open={open}
      confirmLoading={loading}
      okText={
        isEditing ? "Сохранить" : "Добавить"
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
          name="training_date"
          label="Дата обучения"
        >
          <DatePicker
            allowClear
            format="DD.MM.YYYY"
            disabledDate={disabledProcessDate}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item<FormValues>
          name="admission_format"
          label="Форма допуска"
          rules={[
            {
              required: true,
              message:
                "Выберите форму допуска",
            },
          ]}
        >
          <Select
            options={admissionFormatOptions}
            placeholder="Выберите форму допуска"
          />
        </Form.Item>

        <Form.Item<FormValues>
          name="test_date"
          label="Дата тестирования"
          dependencies={["training_date"]}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, testDate: Dayjs | null) {
                const trainingDate =
                  getFieldValue(
                    "training_date",
                  ) as Dayjs | null;

                if (
                  !testDate ||
                  !trainingDate ||
                  !testDate.isBefore(
                    trainingDate,
                    "day",
                  )
                ) {
                  return Promise.resolve();
                }

                return Promise.reject(
                  new Error(
                    "Дата тестирования не может быть раньше даты обучения",
                  ),
                );
              },
            }),
          ]}
        >
          <DatePicker
            allowClear
            format="DD.MM.YYYY"
            disabledDate={disabledTestDate}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item<FormValues>
          name="test_result"
          label="Результат тестирования"
          dependencies={["test_date"]}
          rules={[
            {
              type: "number",
              min: 0,
              max: 100,
              message:
                "Результат должен быть от 0 до 100",
            },
            ({ getFieldValue }) => ({
              validator(_, result: number | null) {
                const testDate =
                  getFieldValue(
                    "test_date",
                  ) as Dayjs | null;

                if (
                  result === null ||
                  result === undefined ||
                  testDate
                ) {
                  return Promise.resolve();
                }

                return Promise.reject(
                  new Error(
                    "Укажите дату тестирования",
                  ),
                );
              },
            }),
          ]}
        >
          <InputNumber
            min={0}
            max={100}
            precision={2}
            placeholder="От 0 до 100"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}