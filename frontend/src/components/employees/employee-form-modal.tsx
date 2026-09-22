"use client";

import { useMemo, useRef, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  App,
  DatePicker,
  Divider,
  Form,
  Input,
  Modal,
  Select,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";

import {
  createEmployee,
  updateEmployee,
  type CandidateType,
  type CreateEmployeeRequest,
  type Employee,
  type HiringDelayReason,
  type HiringRejectionReason,
  type SeparationReason,
  type UpdateEmployeeRequest,
} from "@/lib/api/employees";
import {
  getDistributionCenterDivisions,
  getPositions,
  type DistributionCenter,
} from "@/lib/api/organization";
import {
  candidateTypeOptions,
  hiringDelayReasonOptions,
  hiringRejectionReasonOptions,
  separationReasonOptions,
} from "@/lib/employee-labels";

type EmployeeFormValues = {
  full_name: string;
  personnel_number: string | null;
  manager_id: number | null;
  candidate_type: CandidateType;

  center_id?: number;
  distribution_center_division_id:
    | number
    | null;
  position_id: number | null;

  hire_date: Dayjs | null;
  reason_not_hiring:
    | HiringRejectionReason
    | null;
  reason_delayed_hiring:
    | HiringDelayReason
    | null;
  hiring_comment: string | null;

  separation_date: Dayjs | null;
  separation_reason: SeparationReason | null;
  manager_separation_feedback: string | null;
};

type EmployeeFormModalProps = {
  employee: Employee | null;
  employees: Employee[];
  centers: DistributionCenter[];
  initialCenterId?: number;
  onClose: () => void;
};

function optionalText(
  value: string | null | undefined,
): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function dateValue(
  value: Dayjs | null | undefined,
): string | null {
  return value ? value.format("YYYY-MM-DD") : null;
}

export function EmployeeFormModal({
  employee,
  employees,
  centers,
  initialCenterId,
  onClose,
}: EmployeeFormModalProps) {
  const isEditing = employee !== null;

  const [form] =
    Form.useForm<EmployeeFormValues>();

  const [selectedCenterId, setSelectedCenterId] =
    useState<number | undefined>(initialCenterId);

  const changedFields = useRef(
    new Set<keyof EmployeeFormValues>(),
  );

  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const centerDivisionsQuery = useQuery({
    queryKey: [
      "organization",
      "distribution-center-divisions",
      selectedCenterId,
    ],
    queryFn: () =>
      getDistributionCenterDivisions(
        selectedCenterId as number,
      ),
    enabled: selectedCenterId !== undefined,
  });

  const selectedCenterDivisionId =
    Form.useWatch(
      "distribution_center_division_id",
      form,
    );

  const selectedCenterDivision = useMemo(
    () =>
      centerDivisionsQuery.data?.find(
        (item) =>
          item.id === selectedCenterDivisionId,
      ),
    [
      centerDivisionsQuery.data,
      selectedCenterDivisionId,
    ],
  );

  const divisionId =
    selectedCenterDivision?.division_id;

  const positionsQuery = useQuery({
    queryKey: [
      "organization",
      "positions",
      divisionId,
    ],
    queryFn: () =>
      getPositions(divisionId as number),
    enabled: divisionId !== undefined,
  });

  const saveMutation = useMutation({
    mutationFn: async (
      values: EmployeeFormValues,
    ) => {
      if (!employee) {
        const request: CreateEmployeeRequest = {
          full_name: values.full_name.trim(),
          personnel_number: optionalText(
            values.personnel_number,
          ),
          manager_id: values.manager_id ?? null,
          candidate_type: values.candidate_type,

          distribution_center_division_id:
            values.distribution_center_division_id ??
            null,
          position_id:
            values.position_id ?? null,

          hire_date: dateValue(values.hire_date),
          reason_not_hiring:
            values.reason_not_hiring ?? null,
          reason_delayed_hiring:
            values.reason_delayed_hiring ?? null,
          hiring_comment: optionalText(
            values.hiring_comment,
          ),

          separation_date: dateValue(
            values.separation_date,
          ),
          separation_reason:
            values.separation_reason ?? null,
          manager_separation_feedback:
            optionalText(
              values.manager_separation_feedback,
            ),
        };

        return createEmployee(request);
      }

      const request: UpdateEmployeeRequest = {};

      for (const field of changedFields.current) {
        switch (field) {
          case "manager_id":
            request.manager_id =
              values.manager_id ?? null;
            break;

          case "distribution_center_division_id":
            request.distribution_center_division_id =
              values.distribution_center_division_id ??
              null;
            break;

          case "position_id":
            request.position_id =
              values.position_id ?? null;
            break;

          case "personnel_number":
            request.personnel_number =
              optionalText(
                values.personnel_number,
              );
            break;

          case "hire_date":
            request.hire_date = dateValue(
              values.hire_date,
            );
            break;

          case "reason_not_hiring":
            request.reason_not_hiring =
              values.reason_not_hiring ?? null;
            break;

          case "reason_delayed_hiring":
            request.reason_delayed_hiring =
              values.reason_delayed_hiring ??
              null;
            break;

          case "hiring_comment":
            request.hiring_comment =
              optionalText(
                values.hiring_comment,
              );
            break;

          case "separation_date":
            request.separation_date =
              dateValue(values.separation_date);
            break;

          case "separation_reason":
            request.separation_reason =
              values.separation_reason ?? null;
            break;

          case "manager_separation_feedback":
            request.manager_separation_feedback =
              optionalText(
                values.manager_separation_feedback,
              );
            break;
        }
      }

      return updateEmployee(employee.id, request);
    },

    onSuccess: async () => {
      message.success(
        isEditing
          ? "Сотрудник обновлён"
          : "Сотрудник создан",
      );

      await queryClient.invalidateQueries({
        queryKey: ["employees"],
      });

      onClose();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const initialValues: Partial<EmployeeFormValues> =
    employee
      ? {
          full_name: employee.full_name,
          personnel_number:
            employee.personnel_number,
          manager_id: employee.manager_id,
          candidate_type:
            employee.candidate_type,
          center_id: initialCenterId,
          distribution_center_division_id:
            employee.distribution_center_division_id,
          position_id: employee.position_id,
          hire_date: employee.hire_date
            ? dayjs(employee.hire_date)
            : null,
          reason_not_hiring:
            employee.reason_not_hiring,
          reason_delayed_hiring:
            employee.reason_delayed_hiring,
          hiring_comment:
            employee.hiring_comment,
          separation_date:
            employee.separation_date
              ? dayjs(employee.separation_date)
              : null,
          separation_reason:
            employee.separation_reason,
          manager_separation_feedback:
            employee.manager_separation_feedback,
        }
      : {
          manager_id: null,
          candidate_type: "external_candidate",
          distribution_center_division_id:
            null,
          position_id: null,
          hire_date: null,
          separation_date: null,
        };

  return (
    <Modal
      title={
        isEditing
          ? `Редактирование: ${employee.full_name}`
          : "Новый сотрудник"
      }
      open
      width={850}
      okText={isEditing ? "Сохранить" : "Создать"}
      cancelText="Отмена"
      confirmLoading={saveMutation.isPending}
      onOk={() => form.submit()}
      onCancel={onClose}
    >
      <Form<EmployeeFormValues>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={(changed) => {
          for (const field of Object.keys(
            changed,
          ) as Array<keyof EmployeeFormValues>) {
            changedFields.current.add(field);
          }
        }}
        onFinish={(values) =>
          saveMutation.mutate(values)
        }
      >
        <Divider titlePlacement="start">
          Основные данные
        </Divider>

        <Form.Item
          label="ФИО"
          name="full_name"
          rules={[
            {
              required: true,
              message: "Введите ФИО",
            },
          ]}
        >
          <Input disabled={isEditing} />
        </Form.Item>

        <Form.Item
          label="Табельный номер"
          name="personnel_number"
        >
          <Input maxLength={16} />
        </Form.Item>

        <Form.Item
          label="Тип кандидата"
          name="candidate_type"
          rules={[
            {
              required: true,
              message: "Выберите тип кандидата",
            },
          ]}
        >
          <Select
            disabled={isEditing}
            options={candidateTypeOptions}
          />
        </Form.Item>

        <Form.Item
          label="Руководитель"
          name="manager_id"
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Без руководителя"
            options={employees
              .filter(
                (candidate) =>
                  candidate.id !== employee?.id,
              )
              .map((candidate) => ({
                value: candidate.id,
                label: candidate.full_name,
              }))}
          />
        </Form.Item>

        <Divider titlePlacement="start">
          Организационная структура
        </Divider>

        <Form.Item
          label="Распределительный центр"
          name="center_id"
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Без назначения"
            options={centers.map((center) => ({
              value: center.id,
              label: `${center.code} — ${center.name}`,
            }))}
            onChange={(centerId) => {
              setSelectedCenterId(centerId);

              form.setFieldsValue({
                distribution_center_division_id:
                  null,
                position_id: null,
              });

              changedFields.current.add(
                "distribution_center_division_id",
              );
              changedFields.current.add(
                "position_id",
              );
            }}
          />
        </Form.Item>

        <Form.Item
          label="Подразделение РЦ"
          name="distribution_center_division_id"
          dependencies={["center_id"]}
          extra={
            selectedCenterId !== undefined
              ? "Выберите конкретное подразделение, смену или блок выбранного РЦ"
              : "Сначала выберите распределительный центр"
          }
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                const centerId =
                  getFieldValue("center_id");

                if (
                  centerId === undefined ||
                  centerId === null ||
                  value !== undefined &&
                    value !== null
                ) {
                  return Promise.resolve();
                }

                return Promise.reject(
                  new Error(
                    "Выберите подразделение выбранного РЦ",
                  ),
                );
              },
            }),
          ]}
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            disabled={selectedCenterId === undefined}
            loading={centerDivisionsQuery.isLoading}
            placeholder="Выберите подразделение РЦ"
            options={(
              centerDivisionsQuery.data ?? []
            ).map((division) => ({
              value: division.id,
              label: division.name,
            }))}
            onChange={() => {
              form.setFieldValue(
                "position_id",
                null,
              );

              changedFields.current.add(
                "distribution_center_division_id",
              );
              changedFields.current.add(
                "position_id",
              );
            }}
          />
        </Form.Item>

        <Form.Item label="Группа подразделений">
          <Input
            disabled
            value={
              selectedCenterDivision
                ? `${selectedCenterDivision.division.division_group.abbreviation} — ${selectedCenterDivision.division.division_group.name}`
                : ""
            }
          />
        </Form.Item>

        <Form.Item
          label="Должность"
          name="position_id"
          dependencies={[
            "distribution_center_division_id",
          ]}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                const centerDivisionId =
                  getFieldValue(
                    "distribution_center_division_id",
                  );

                if (
                  centerDivisionId === undefined ||
                  centerDivisionId === null ||
                  (value !== undefined && value !== null)
                ) {
                  return Promise.resolve();
                }

                return Promise.reject(
                  new Error("Выберите должность"),
                );
              },
            }),
          ]}
        >
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            disabled={divisionId === undefined}
            loading={positionsQuery.isLoading}
            placeholder="Выберите должность"
            options={(
              positionsQuery.data ?? []
            ).map((position) => ({
              value: position.id,
              label: position.name,
            }))}
          />
        </Form.Item>

        <Divider titlePlacement="start">
          Найм
        </Divider>

        <Form.Item
          label="Дата приёма"
          name="hire_date"
        >
          <DatePicker
            format="DD.MM.YYYY"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Причина отказа в найме"
          name="reason_not_hiring"
        >
          <Select
            allowClear
            options={
              hiringRejectionReasonOptions
            }
          />
        </Form.Item>

        <Form.Item
          label="Причина задержки найма"
          name="reason_delayed_hiring"
        >
          <Select
            allowClear
            options={hiringDelayReasonOptions}
          />
        </Form.Item>

        <Form.Item
          label="Комментарий по найму"
          name="hiring_comment"
        >
          <Input.TextArea rows={3} />
        </Form.Item>

        <Divider titlePlacement="start">
          Увольнение
        </Divider>

        <Form.Item
          label="Дата увольнения"
          name="separation_date"
        >
          <DatePicker
            format="DD.MM.YYYY"
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          label="Причина увольнения"
          name="separation_reason"
        >
          <Select
            allowClear
            options={separationReasonOptions}
          />
        </Form.Item>

        <Form.Item
          label="Комментарий руководителя"
          name="manager_separation_feedback"
        >
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}