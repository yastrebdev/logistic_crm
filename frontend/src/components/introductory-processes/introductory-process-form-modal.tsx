"use client";

import { useEffect } from "react";
import {
  DatePicker,
  Form,
  Modal,
  Select,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";

import type {
  IntroductoryProcess,
  IntroductoryProcessCreate,
  IntroductoryProcessUpdate,
} from "@/lib/api/introductory-processes";
import type { Employee } from "@/lib/api/employees";
import {
  USER_TYPE_LABELS,
  type User,
} from "@/lib/api/users";

type FormValues = {
  employee_id: number;
  tutor_id: number;
  start_date: Dayjs;
  end_date?: Dayjs | null;
};

type IntroductoryProcessFormModalProps = {
  open: boolean;
  process: IntroductoryProcess | null;
  employees: Employee[];
  users: User[];
  fixedEmployeeId?: number;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (
    data:
      | IntroductoryProcessCreate
      | IntroductoryProcessUpdate,
  ) => void;
};

function formatDate(value: Dayjs): string {
  return value.format("YYYY-MM-DD");
}

export function IntroductoryProcessFormModal({
  open,
  process,
  employees,
  users,
  fixedEmployeeId,
  loading = false,
  onCancel,
  onSubmit,
}: IntroductoryProcessFormModalProps) {
  const [form] = Form.useForm<FormValues>();

  const isEditing = process !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (process) {
      form.setFieldsValue({
        employee_id: process.employee_id,
        tutor_id: process.tutor_id,
        start_date: dayjs(process.start_date),
        end_date: process.end_date
          ? dayjs(process.end_date)
          : null,
      });

      return;
    }

    form.setFieldsValue({
      employee_id: fixedEmployeeId,
      tutor_id: undefined,
      start_date: dayjs(),
      end_date: null,
    });
  }, [
    fixedEmployeeId,
    form,
    open,
    process,
  ]);

  const handleFinish = (values: FormValues) => {
    const employeeId =
      fixedEmployeeId ?? values.employee_id;

    const startDate = formatDate(
      values.start_date,
    );

    const endDate = values.end_date
      ? formatDate(values.end_date)
      : null;

    if (!process) {
      const request: IntroductoryProcessCreate = {
        employee_id: employeeId,
        tutor_id: values.tutor_id,
        start_date: startDate,
      };

      if (endDate !== null) {
        request.end_date = endDate;
      }

      onSubmit(request);
      return;
    }

    const request: IntroductoryProcessUpdate = {};

    if (employeeId !== process.employee_id) {
      request.employee_id = employeeId;
    }

    if (values.tutor_id !== process.tutor_id) {
      request.tutor_id = values.tutor_id;
    }

    if (startDate !== process.start_date) {
      request.start_date = startDate;
    }

    /*
     * Здесь важно сравнивать и null.
     * Если пользователь очистил дату окончания,
     * в PATCH уйдёт endBots_date: null.
     */
    if (endDate !== process.end_date) {
      request.end_date = endDate;
    }

    onSubmit(request);
  };

    const availableUsers = users.filter(
      (user) =>
        user.is_active ||
        user.id === process?.tutor_id,
    );

  return (
    <Modal
      title={
        isEditing
          ? "Редактирование вводного процесса"
          : "Создание вводного процесса"
      }
      open={open}
      confirmLoading={loading}
      okText={isEditing ? "Сохранить" : "Создать"}
      cancelText="Отмена"
      destroyOnHidden
      onCancel={onCancel}
      onOk={() => form.submit()}
      afterClose={() => form.resetFields()}
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item<FormValues>
          name="employee_id"
          label="Сотрудник"
          rules={[
            {
              required: true,
              message: "Выберите сотрудника",
            },
          ]}
        >
          <Select
            showSearch
            disabled={fixedEmployeeId !== undefined}
            placeholder="Выберите сотрудника"
            optionFilterProp="label"
            options={employees.map((employee) => ({
              value: employee.id,
              label: employee.personnel_number
                ? `${employee.full_name} — ${employee.personnel_number}`
                : employee.full_name,
            }))}
          />
        </Form.Item>

        <Form.Item<FormValues>
          name="tutor_id"
          label="Ответственный за вводное"
          rules={[
            {
              required: true,
              message: "Выберите ответственного",
            },
          ]}
        >
          <Select
            showSearch
            placeholder="Выберите ответственного"
            optionFilterProp="label"
            options={availableUsers.map((user) =>({
              value: user.id,
              label: `${user.email} — ${
                USER_TYPE_LABELS[user.user_type]
              }`,
            }))}
          />
        </Form.Item>

        <Form.Item<FormValues>
          name="start_date"
          label="Дата начала"
          rules={[
            {
              required: true,
              message: "Укажите дату начала",
            },
          ]}
        >
          <DatePicker
            format="DD.MM.YYYY"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item<FormValues>
          name="end_date"
          label="Дата окончания"
          dependencies={["start_date"]}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, endDate: Dayjs | null) {
                const startDate =
                  getFieldValue("start_date") as
                    | Dayjs
                    | undefined;

                if (
                  !endDate ||
                  !startDate ||
                  !endDate.isBefore(
                    startDate,
                    "day",
                  )
                ) {
                  return Promise.resolve();
                }

                return Promise.reject(
                  new Error(
                    "Дата окончания не может быть раньше даты начала",
                  ),
                );
              },
            }),
          ]}
        >
          <DatePicker
            allowClear
            format="DD.MM.YYYY"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}