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
  IntroductoryProcess,
  MainInternship,
  MainInternshipCreate,
  MainInternshipUpdate,
  MentorAssignmentStatus,
} from "@/lib/api/introductory-processes";
import { mentorAssignmentStatusOptions } from "@/lib/onboarding-labels";

type FormValues = {
  mentor_assignment_status:
    MentorAssignmentStatus;
  mentor_id?: number | null;
  start_date: Dayjs;
  end_date?: Dayjs | null;
};

type MainInternshipFormModalProps = {
  open: boolean;
  process: IntroductoryProcess;
  internship: MainInternship | null;
  employees: Employee[];
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (
    data:
      | MainInternshipCreate
      | MainInternshipUpdate,
  ) => void;
};

const assignedStatus: MentorAssignmentStatus =
  "Mentor is assigned";

function formatNullableDate(
  value?: Dayjs | null,
): string | null {
  return value
    ? value.format("YYYY-MM-DD")
    : null;
}

export function MainInternshipFormModal({
  open,
  process,
  internship,
  employees,
  loading = false,
  onCancel,
  onSubmit,
}: MainInternshipFormModalProps) {
  const [form] = Form.useForm<FormValues>();

  const selectedStatus = Form.useWatch(
    "mentor_assignment_status",
    form,
  );

  const isEditing = internship !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (internship) {
      form.setFieldsValue({
        mentor_assignment_status:
          internship.mentor_assignment_status,
        mentor_id: internship.mentor_id,
        start_date: dayjs(
          internship.start_date,
        ),
        end_date: internship.end_date
          ? dayjs(internship.end_date)
          : null,
      });

      return;
    }

    form.setFieldsValue({
      mentor_assignment_status:
        "Mentor is not required",
      mentor_id: null,
      start_date: dayjs(
        process.start_date,
      ),
      end_date: null,
    });
  }, [form, internship, open, process.start_date]);

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

  const disabledEndDate = (
    current: Dayjs,
  ): boolean => {
    if (disabledProcessDate(current)) {
      return true;
    }

    const startDate =
      form.getFieldValue("start_date");

    if (!startDate) {
      return false;
    }

    return current
      .startOf("day")
      .isBefore(startDate.startOf("day"));
  };

  const handleStatusChange = (
    status: MentorAssignmentStatus,
  ) => {
    if (status !== assignedStatus) {
      form.setFieldValue(
        "mentor_id",
        null,
      );
    }
  };

  const handleFinish = (
    values: FormValues,
  ) => {
    const mentorId =
      values.mentor_assignment_status ===
      assignedStatus
        ? (values.mentor_id ?? null)
        : null;

    const startDate =
      values.start_date.format(
        "YYYY-MM-DD",
      );

    const endDate = formatNullableDate(
      values.end_date,
    );

    if (!internship) {
      const request: MainInternshipCreate =
        {
          introductory_process_id:
            process.id,
          mentor_assignment_status:
            values.mentor_assignment_status,
          mentor_id: mentorId,
          start_date: startDate,
        };

      if (endDate !== null) {
        request.end_date = endDate;
      }

      onSubmit(request);
      return;
    }

    const request: MainInternshipUpdate =
      {};

    if (
      values.mentor_assignment_status !==
      internship.mentor_assignment_status
    ) {
      request.mentor_assignment_status =
        values.mentor_assignment_status;
    }

    if (
      mentorId !== internship.mentor_id
    ) {
      request.mentor_id = mentorId;
    }

    if (
      startDate !== internship.start_date
    ) {
      request.start_date = startDate;
    }

    if (endDate !== internship.end_date) {
      request.end_date = endDate;
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

  return (
    <Modal
      title={
        isEditing
          ? "Редактирование основной стажировки"
          : "Добавление основной стажировки"
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
          name="mentor_assignment_status"
          label="Статус назначения наставника"
          rules={[
            {
              required: true,
              message:
                "Выберите статус наставника",
            },
          ]}
        >
          <Select
            options={
              mentorAssignmentStatusOptions
            }
            onChange={handleStatusChange}
          />
        </Form.Item>

        {selectedStatus === assignedStatus && (
          <Form.Item<FormValues>
            name="mentor_id"
            label="Наставник"
            rules={[
              {
                required: true,
                message:
                  "Выберите наставника",
              },
            ]}
          >
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              placeholder="Выберите сотрудника"
              options={mentorOptions}
            />
          </Form.Item>
        )}

        <Form.Item<FormValues>
          name="start_date"
          label="Дата начала"
          rules={[
            {
              required: true,
              message:
                "Укажите дату начала",
            },
          ]}
        >
          <DatePicker
            format="DD.MM.YYYY"
            disabledDate={disabledProcessDate}
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
                  getFieldValue(
                    "start_date",
                  ) as Dayjs | undefined;

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
            disabledDate={disabledEndDate}
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}