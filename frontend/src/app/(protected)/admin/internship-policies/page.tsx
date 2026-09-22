"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";

import { useCurrentUser } from "@/hooks/use-current-user";
import {
  createInternshipPolicy,
  deleteInternshipPolicy,
  getInternshipPolicies,
  updateInternshipPolicy,
  type InternshipPolicy,
  type InternshipPolicyCreate,
} from "@/lib/api/internship-policies";
import {
  getDivisionGroups,
  getDivisions,
  getPositions,
} from "@/lib/api/organization";
import {
  positionCategoryLabels,
} from "@/lib/adaptation-labels";
import { hasPermission } from "@/lib/permissions";

type PolicyFormValues = {
  position_id: number;
  effective_from: Dayjs;
  effective_to?: Dayjs | null;
  duration_min_days: number;
  duration_max_days: number;
  probation_months: number;
  mentor_payment_amount: number;
};

function formatDate(
  value: string | null,
): string {
  return value
    ? dayjs(value).format("DD.MM.YYYY")
    : "Бессрочно";
}

function toRequest(
  values: PolicyFormValues,
): InternshipPolicyCreate {
  return {
    position_id: values.position_id,

    effective_from:
      values.effective_from.format(
        "YYYY-MM-DD",
      ),

    effective_to: values.effective_to
      ? values.effective_to.format(
          "YYYY-MM-DD",
        )
      : null,

    duration_min_days:
      values.duration_min_days,

    duration_max_days:
      values.duration_max_days,

    probation_months:
      values.probation_months,

    mentor_payment_amount: String(
      values.mentor_payment_amount,
    ),
  };
}

export default function InternshipPoliciesPage() {
  const { data: currentUser } =
    useCurrentUser();

  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [selectedGroupId, setSelectedGroupId] =
    useState<number>();

  const [
    selectedDivisionId,
    setSelectedDivisionId,
  ] = useState<number>();

  const [
    selectedPositionId,
    setSelectedPositionId,
  ] = useState<number>();

  const [createOpen, setCreateOpen] =
    useState(false);

  const [editingPolicy, setEditingPolicy] =
    useState<InternshipPolicy | null>(
      null,
    );

  const [createForm] =
    Form.useForm<PolicyFormValues>();

  const [editForm] =
    Form.useForm<PolicyFormValues>();

  const canRead =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "onboarding.read",
    );

  const canCreate =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "onboarding.create",
    );

  const canUpdate =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "onboarding.update",
    );

  const canDelete =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "onboarding.delete",
    );

  const groupsQuery = useQuery({
    queryKey: [
      "organization",
      "division-groups",
    ],
    queryFn: getDivisionGroups,
    enabled: canRead,
  });

  const divisionsQuery = useQuery({
    queryKey: [
      "organization",
      "divisions",
      "all",
    ],
    queryFn: () => getDivisions(),
    enabled: canRead,
  });

  const positionsQuery = useQuery({
    queryKey: [
      "organization",
      "positions",
      "all",
    ],
    queryFn: () => getPositions(),
    enabled: canRead,
  });

  const policiesQuery = useQuery({
    queryKey: [
      "internship-policies",
      selectedPositionId ?? "all",
    ],
    queryFn: () =>
      getInternshipPolicies({
        positionId: selectedPositionId,
      }),
    enabled: canRead,
  });

  const groupById = useMemo(
    () =>
      new Map(
        (groupsQuery.data ?? []).map(
          (group) => [
            group.id,
            group,
          ],
        ),
      ),
    [groupsQuery.data],
  );

  const divisionById = useMemo(
    () =>
      new Map(
        (divisionsQuery.data ?? []).map(
          (division) => [
            division.id,
            division,
          ],
        ),
      ),
    [divisionsQuery.data],
  );

  const positionById = useMemo(
    () =>
      new Map(
        (positionsQuery.data ?? []).map(
          (position) => [
            position.id,
            position,
          ],
        ),
      ),
    [positionsQuery.data],
  );

  const availableDivisions = useMemo(() => {
    const divisions =
      divisionsQuery.data ?? [];

    if (selectedGroupId === undefined) {
      return divisions;
    }

    return divisions.filter(
      (division) =>
        division.division_group_id
        === selectedGroupId,
    );
  }, [
    divisionsQuery.data,
    selectedGroupId,
  ]);

  const availablePositions = useMemo(() => {
    const positions =
      positionsQuery.data ?? [];

    if (
      selectedDivisionId !== undefined
    ) {
      return positions.filter(
        (position) =>
          position.division_id
          === selectedDivisionId,
      );
    }

    if (selectedGroupId !== undefined) {
      const divisionIds = new Set(
        availableDivisions.map(
          (division) => division.id,
        ),
      );

      return positions.filter(
        (position) =>
          divisionIds.has(
            position.division_id,
          ),
      );
    }

    return positions;
  }, [
    positionsQuery.data,
    selectedDivisionId,
    selectedGroupId,
    availableDivisions,
  ]);

  const visiblePolicies = useMemo(() => {
    const policies =
      policiesQuery.data ?? [];

    if (
      selectedPositionId !== undefined
    ) {
      return policies;
    }

    const positionIds = new Set(
      availablePositions.map(
        (position) => position.id,
      ),
    );

    return policies.filter(
      (policy) =>
        positionIds.has(policy.position_id),
    );
  }, [
    policiesQuery.data,
    selectedPositionId,
    availablePositions,
  ]);

  const invalidatePolicies = () =>
    queryClient.invalidateQueries({
      queryKey: ["internship-policies"],
    });

  const createMutation = useMutation({
    mutationFn: createInternshipPolicy,

    onSuccess: async () => {
      message.success(
        "Норматив стажировки создан",
      );

      setCreateOpen(false);
      createForm.resetFields();

      await invalidatePolicies();
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      policyId,
      data,
    }: {
      policyId: number;
      data: InternshipPolicyCreate;
    }) =>
      updateInternshipPolicy(
        policyId,
        data,
      ),

    onSuccess: async () => {
      message.success(
        "Норматив стажировки обновлён",
      );

      setEditingPolicy(null);
      editForm.resetFields();

      await invalidatePolicies();
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInternshipPolicy,

    onSuccess: async () => {
      message.success(
        "Норматив стажировки удалён",
      );

      await invalidatePolicies();
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const openCreate = () => {
    createForm.setFieldsValue({
      position_id: selectedPositionId,
      effective_to: null,
      probation_months: 3,
    });

    setCreateOpen(true);
  };

  const openEdit = (
    policy: InternshipPolicy,
  ) => {
    setEditingPolicy(policy);

    editForm.setFieldsValue({
      position_id: policy.position_id,

      effective_from: dayjs(
        policy.effective_from,
      ),

      effective_to: policy.effective_to
        ? dayjs(policy.effective_to)
        : null,

      duration_min_days:
        policy.duration_min_days,

      duration_max_days:
        policy.duration_max_days,

      probation_months:
        policy.probation_months,

      mentor_payment_amount: Number(
        policy.mentor_payment_policy
          ?.amount ?? 0,
      ),
    });
  };

  const confirmDelete = (
    policy: InternshipPolicy,
  ) => {
    const position = positionById.get(
      policy.position_id,
    );

    modal.confirm({
      title: "Удалить норматив?",

      content: (
        <>
          Норматив для должности{" "}
          <Typography.Text strong>
            {position?.name
              ?? `ID ${policy.position_id}`}
          </Typography.Text>{" "}
          будет удалён.
        </>
      ),

      okText: "Удалить",
      cancelText: "Отмена",
      okType: "danger",

      onOk: () =>
        deleteMutation.mutateAsync(
          policy.id,
        ),
    });
  };

  const columns: ColumnsType<
    InternshipPolicy
  > = [
    {
      title: "Должность",
      dataIndex: "position_id",
      width: 260,
      fixed: "left",

      render: (positionId: number) => {
        const position =
          positionById.get(positionId);

        return position?.name
          ?? `ID ${positionId}`;
      },
    },
    {
      title: "Подразделение",
      dataIndex: "position_id",
      width: 260,

      render: (positionId: number) => {
        const position =
          positionById.get(positionId);

        const division = position
          ? divisionById.get(
              position.division_id,
            )
          : undefined;

        return division?.name ?? "—";
      },
    },
    {
      title: "Категория",
      dataIndex: "position_id",
      width: 180,

      render: (positionId: number) => {
        const position =
          positionById.get(positionId);

        return position ? (
          <Tag>
            {
              positionCategoryLabels[
                position.category
              ]
            }
          </Tag>
        ) : (
          "—"
        );
      },
    },
    {
      title: "Действует с",
      dataIndex: "effective_from",
      width: 130,
      render: formatDate,
    },
    {
      title: "Действует по",
      dataIndex: "effective_to",
      width: 140,
      render: formatDate,
    },
    {
      title: "Стажировка",
      key: "duration",
      width: 150,

      render: (_, policy) =>
        policy.duration_min_days
        === policy.duration_max_days
          ? `${policy.duration_min_days} дн.`
          : (
              `${policy.duration_min_days}` +
              `–${policy.duration_max_days} дн.`
            ),
    },
    {
      title: "Испытательный срок",
      dataIndex: "probation_months",
      width: 180,

      render: (value: number) =>
        `${value} мес.`,
    },
    {
      title: "Выплата наставнику",
      key: "payment",
      width: 180,

      render: (_, policy) => {
        const amount =
          policy.mentor_payment_policy
            ?.amount;

        return amount === undefined
          ? "—"
          : `${Number(amount).toLocaleString(
              "ru-RU",
            )} ₽`;
      },
    },
    {
      title: "Действия",
      key: "actions",
      width: 190,
      fixed: "right",

      render: (_, policy) => (
        <Space>
          {canUpdate && (
            <Button
              icon={<EditOutlined />}
              onClick={() =>
                openEdit(policy)
              }
            >
              Изменить
            </Button>
          )}

          {canDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={
                deleteMutation.isPending &&
                deleteMutation.variables
                === policy.id
              }
              onClick={() =>
                confirmDelete(policy)
              }
            />
          )}
        </Space>
      ),
    },
  ];

  const queryError =
    groupsQuery.error
    || divisionsQuery.error
    || positionsQuery.error
    || policiesQuery.error;

  if (
    currentUser !== undefined &&
    !canRead
  ) {
    return (
      <Alert
        type="error"
        message="Недостаточно прав"
        description={
          "Нет разрешения onboarding.read"
        }
        showIcon
      />
    );
  }

  return (
    <>
      <Space
        orientation="vertical"
        size="large"
        style={{ width: "100%" }}
      >
        <div>
          <Typography.Title
            level={2}
            style={{ marginBottom: 4 }}
          >
            Нормативы стажировок
          </Typography.Title>

          <Typography.Text type="secondary">
            Продолжительность стажировки,
            испытательный срок и выплата
            наставнику
          </Typography.Text>
        </div>

        {queryError && (
          <Alert
            type="error"
            message={
              "Не удалось загрузить нормативы"
            }
            description={queryError.message}
            showIcon
          />
        )}

        <Card
          extra={
            canCreate ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreate}
              >
                Добавить норматив
              </Button>
            ) : null
          }
        >
          <Space
            orientation="vertical"
            size="middle"
            style={{ width: "100%" }}
          >
            <Space wrap>
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Все группы"
                value={selectedGroupId}
                loading={
                  groupsQuery.isLoading
                }
                style={{ width: 300 }}
                options={
                  groupsQuery.data?.map(
                    (group) => ({
                      value: group.id,
                      label: (
                        `${group.abbreviation}` +
                        ` — ${group.name}`
                      ),
                    }),
                  )
                }
                onChange={(groupId) => {
                  setSelectedGroupId(groupId);
                  setSelectedDivisionId(
                    undefined,
                  );
                  setSelectedPositionId(
                    undefined,
                  );
                }}
              />

              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Все подразделения"
                value={selectedDivisionId}
                loading={
                  divisionsQuery.isLoading
                }
                style={{ width: 360 }}
                options={
                  availableDivisions.map(
                    (division) => ({
                      value: division.id,
                      label: division.name,
                    }),
                  )
                }
                onChange={(divisionId) => {
                  setSelectedDivisionId(
                    divisionId,
                  );
                  setSelectedPositionId(
                    undefined,
                  );
                }}
              />

              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Все должности"
                value={selectedPositionId}
                loading={
                  positionsQuery.isLoading
                }
                style={{ width: 320 }}
                options={
                  availablePositions.map(
                    (position) => ({
                      value: position.id,
                      label: position.name,
                    }),
                  )
                }
                onChange={
                  setSelectedPositionId
                }
              />
            </Space>

            <Table<InternshipPolicy>
              rowKey="id"
              loading={
                policiesQuery.isLoading
              }
              columns={columns}
              dataSource={visiblePolicies}
              scroll={{ x: 1700 }}
              pagination={false}
              locale={{
                emptyText:
                  "Нормативы не найдены",
              }}
            />
          </Space>
        </Card>
      </Space>

      <Modal
        title="Новый норматив"
        open={createOpen}
        width={680}
        forceRender
        okText="Создать"
        cancelText="Отмена"
        confirmLoading={
          createMutation.isPending
        }
        onOk={() => createForm.submit()}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
      >
        <PolicyForm
          form={createForm}
          positions={
            positionsQuery.data ?? []
          }
          onFinish={(values) =>
            createMutation.mutate(
              toRequest(values),
            )
          }
        />
      </Modal>

      <Modal
        title="Редактирование норматива"
        open={editingPolicy !== null}
        width={680}
        forceRender
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={
          updateMutation.isPending
        }
        onOk={() => editForm.submit()}
        onCancel={() => {
          setEditingPolicy(null);
          editForm.resetFields();
        }}
      >
        <PolicyForm
          form={editForm}
          positions={
            positionsQuery.data ?? []
          }
          onFinish={(values) => {
            if (!editingPolicy) {
              return;
            }

            updateMutation.mutate({
              policyId:
                editingPolicy.id,
              data: toRequest(values),
            });
          }}
        />
      </Modal>
    </>
  );
}

type PolicyFormProps = {
  form: ReturnType<
    typeof Form.useForm<PolicyFormValues>
  >[0];

  positions: Array<{
    id: number;
    name: string;
  }>;

  onFinish: (
    values: PolicyFormValues,
  ) => void;
};

function PolicyForm({
  form,
  positions,
  onFinish,
}: PolicyFormProps) {
  return (
    <Form<PolicyFormValues>
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        name="position_id"
        label="Должность"
        rules={[
          {
            required: true,
            message: "Выберите должность",
          },
        ]}
      >
        <Select
          showSearch
          optionFilterProp="label"
          placeholder="Выберите должность"
          options={positions.map(
            (position) => ({
              value: position.id,
              label: position.name,
            }),
          )}
        />
      </Form.Item>

      <Space align="start">
        <Form.Item
          name="effective_from"
          label="Действует с"
          rules={[
            {
              required: true,
              message: "Укажите дату",
            },
          ]}
        >
          <DatePicker format="DD.MM.YYYY" />
        </Form.Item>

        <Form.Item
          name="effective_to"
          label="Действует по"
        >
          <DatePicker
            allowClear
            format="DD.MM.YYYY"
          />
        </Form.Item>
      </Space>

      <Space align="start">
        <NumberField
          name="duration_min_days"
          label="Минимум дней"
          min={1}
        />

        <NumberField
          name="duration_max_days"
          label="Максимум дней"
          min={1}
        />

        <NumberField
          name="probation_months"
          label="Испытательный срок"
          min={1}
          suffix="мес."
        />
      </Space>

      <Form.Item
        name="mentor_payment_amount"
        label="Общая выплата наставнику"
        rules={[
          {
            required: true,
            message: "Укажите сумму",
          },
        ]}
      >
        <InputNumber
          min={0}
          precision={2}
          step={100}
          style={{ width: 240 }}
        />
      </Form.Item>
    </Form>
  );
}

type NumericFieldName =
  | "duration_min_days"
  | "duration_max_days"
  | "probation_months";

type NumberFieldProps = {
  name: NumericFieldName;
  label: string;
  min: number;
  suffix?: string;
};

function NumberField({
  name,
  label,
  min,
  suffix = "дн.",
}: NumberFieldProps) {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={[
        {
          required: true,
          message: "Укажите значение",
        },
      ]}
    >
      <Space size="small">
        <InputNumber
          min={min}
          precision={0}
          style={{ width: 130 }}
        />

        <Typography.Text type="secondary">
          {suffix}
        </Typography.Text>
      </Space>
    </Form.Item>
  );
}