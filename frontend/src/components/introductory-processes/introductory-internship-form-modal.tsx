"use client";

import { useEffect } from "react";
import {
  DatePicker,
  Form,
  Modal,
  Select,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";

import type { Employee } from "@/lib/api/employees";
import type {
  IntroductoryInternship,
  IntroductoryInternshipCreate,
  IntroductoryInternshipUpdate,
  IntroductoryProcess,
} from "@/lib/api/introductory-processes";

type FormValues = {
  mentor_id: number;
  internship_date: Dayjs;
};

type IntroductoryInternshipFormModalProps = {
  open: boolean;
  process: IntroductoryProcess;
  internship: IntroductoryInternship | null;
  employees: Employee[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (
    data:
      | IntroductoryInternshipCreate
      | IntroductoryInternshipUpdate,
  ) => void;
};

export function IntroductoryInternshipFormModal({
  open,
  process,
  internship,
  employees,
  loading = false,
  onCancel,
  onSubmit,
}: IntroductoryInternshipFormModalProps) {
  const [form] = Form.useForm<FormValues>();

  const isEditing = internship !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (internship) {
      form.setFieldsValue({
        mentor_id: internship.mentor_id,
        internship_date: dayjs(
          internship.internship_date,
        ),
      });

      return;
    }

    form.setFieldsValue({
      mentor_id: undefined,
      internship_date: dayjs(
        process.start_date,
      ),
    });
  }, [form, internship, open, process.start_date]);

  const handleFinish = (values: FormValues) => {
    const internshipDate =
      values.internship_date.format(
        "YYYY-MM-DD",
      );

    if (!internship) {
      const request: IntroductoryInternshipCreate =
        {
          introductory_process_id:
            process.id,
          mentor_id: values.mentor_id,
          internship_date: internshipDate,
        };

      onSubmit(request);
      return;
    }

    const request: IntroductoryInternshipUpdate =
      {};

    if (
      values.mentor_id !==
      internship.mentor_id
    ) {
      request.mentor_id =
        values.mentor_id;
    }

    if (
      internshipDate !==
      internship.internship_date
    ) {
      request.internship_date =
        internshipDate;
    }

    onSubmit(request);
  };

  const mentorOptions = employees
    .filter(
      (employee) =>
        employee.id !== process.employee_id,
    )
    .map((employee) => ({
      value: employee.id,
      label: employee.personnel_number
        ? `${employee.full_name} — ${employee.personnel_number}`
        : employee.full_name,
    }));

  const disabledDate = (
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

  return (
    <Modal
      title={
        isEditing
          ? "Редактирование вводной стажировки"
          : "Добавление вводной стажировки"
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
          name="mentor_id"
          label="Наставник"
          rules={[
            {
              required: true,
              message: "Выберите наставника",
            },
          ]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Выберите сотрудника"
            options={mentorOptions}
          />
        </Form.Item>

        <Form.Item<FormValues>
          name="internship_date"
          label="Дата стажировки"
          rules={[
            {
              required: true,
              message:
                "Укажите дату стажировки",
            },
          ]}
        >
          <DatePicker
            format="DD.MM.YYYY"
            disabledDate={disabledDate}
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}