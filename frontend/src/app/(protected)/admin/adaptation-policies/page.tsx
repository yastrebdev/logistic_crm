"use client";

import { useState } from "react";
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
  createAdaptationPolicy,
  deleteAdaptationPolicy,
  getAdaptationPolicies,
  updateAdaptationPolicy,
  type AdaptationPolicy,
  type AdaptationPolicyCreate,
} from "@/lib/api/adaptations";
import type { PositionCategory } from "@/lib/api/organization";
import {
  positionCategoryLabels,
  positionCategoryOptions,
} from "@/lib/adaptation-labels";
import { hasPermission } from "@/lib/permissions";

type PolicyFormValues = Omit<
  AdaptationPolicyCreate,
  "effective_from" | "effective_to"
> & {
  effective_from: Dayjs;
  effective_to?: Dayjs | null;
};

function formatDate(value: string | null): string {
  return value
    ? dayjs(value).format("DD.MM.YYYY")
    : "Бессрочно";
}

function toRequest(
  values: PolicyFormValues,
): AdaptationPolicyCreate {
  return {
    ...values,
    effective_from:
      values.effective_from.format("YYYY-MM-DD"),
    effective_to: values.effective_to
      ? values.effective_to.format("YYYY-MM-DD")
      : null,
  };
}

export default function AdaptationPoliciesPage() {
  const { data: currentUser } = useCurrentUser();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] =
    useState<PositionCategory>();

  const [createOpen, setCreateOpen] =
    useState(false);

  const [editingPolicy, setEditingPolicy] =
    useState<AdaptationPolicy | null>(null);

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

  const policiesQuery = useQuery({
    queryKey: [
      "adaptation-policies",
      selectedCategory ?? "all",
    ],
    queryFn: () =>
      getAdaptationPolicies({
        positionCategory: selectedCategory,
      }),
    enabled: canRead,
  });

  const invalidatePolicies = () =>
    queryClient.invalidateQueries({
      queryKey: ["adaptation-policies"],
    });

  const createMutation = useMutation({
    mutationFn: createAdaptationPolicy,

    onSuccess: async () => {
      message.success(
        "Правило адаптации создано",
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
      data: AdaptationPolicyCreate;
    }) =>
      updateAdaptationPolicy(
        policyId,
        data,
      ),

    onSuccess: async () => {
      message.success(
        "Правило адаптации обновлено",
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
    mutationFn: deleteAdaptationPolicy,

    onSuccess: async () => {
      message.success(
        "Правило адаптации удалено",
      );

      await invalidatePolicies();
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });

  const openCreateModal = () => {
    createForm.setFieldsValue({
      effective_to: null,
      total_deadline_days: 91,
    });

    setCreateOpen(true);
  };

  const openEditModal = (
    policy: AdaptationPolicy,
  ) => {
    setEditingPolicy(policy);

    editForm.setFieldsValue({
      effective_from: dayjs(
        policy.effective_from,
      ),

      effective_to: policy.effective_to
        ? dayjs(policy.effective_to)
        : null,

      position_category:
        policy.position_category,

      stage_1_start_offset_days:
        policy.stage_1_start_offset_days,

      stage_1_duration_days:
        policy.stage_1_duration_days,

      stage_2_red_offset_days:
        policy.stage_2_red_offset_days,

      stage_2_normal_offset_days:
        policy.stage_2_normal_offset_days,

      stage_2_duration_days:
        policy.stage_2_duration_days,

      stage_3_red_offset_days:
        policy.stage_3_red_offset_days,

      stage_3_normal_offset_days:
        policy.stage_3_normal_offset_days,

      stage_3_duration_days:
        policy.stage_3_duration_days,

      total_deadline_days:
        policy.total_deadline_days,
    });
  };

  const confirmDelete = (
    policy: AdaptationPolicy,
  ) => {
    modal.confirm({
      title: "Удалить правило адаптации?",

      content: (
        <>
          Правило для категории{" "}
          <Typography.Text strong>
            {
              positionCategoryLabels[
                policy.position_category
              ]
            }
          </Typography.Text>{" "}
          будет удалено.
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

  const columns: ColumnsType<AdaptationPolicy> = [
    {
      title: "Категория",
      dataIndex: "position_category",
      width: 190,
      fixed: "left",

      render: (
        category: PositionCategory,
      ) => (
        <Tag>
          {
            positionCategoryLabels[
              category
            ]
          }
        </Tag>
      ),
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
      title: "Этап 1",
      children: [
        {
          title: "Старт",
          dataIndex:
            "stage_1_start_offset_days",
          width: 100,
          render: (value: number) =>
            `+${value} дн.`,
        },
        {
          title: "Длительность",
          dataIndex:
            "stage_1_duration_days",
          width: 130,
          render: (value: number) =>
            `${value} дн.`,
        },
      ],
    },
    {
      title: "Этап 2",
      children: [
        {
          title: "После красного",
          dataIndex:
            "stage_2_red_offset_days",
          width: 140,
          render: (value: number) =>
            `+${value} дн.`,
        },
        {
          title: "Обычно",
          dataIndex:
            "stage_2_normal_offset_days",
          width: 110,
          render: (value: number) =>
            `+${value} дн.`,
        },
        {
          title: "Длительность",
          dataIndex:
            "stage_2_duration_days",
          width: 130,
          render: (value: number) =>
            `${value} дн.`,
        },
      ],
    },
    {
      title: "Этап 3",
      children: [
        {
          title: "После красного",
          dataIndex:
            "stage_3_red_offset_days",
          width: 140,
          render: (value: number) =>
            `+${value} дн.`,
        },
        {
          title: "Обычно",
          dataIndex:
            "stage_3_normal_offset_days",
          width: 110,
          render: (value: number) =>
            `+${value} дн.`,
        },
        {
          title: "Длительность",
          dataIndex:
            "stage_3_duration_days",
          width: 130,
          render: (value: number) =>
            `${value} дн.`,
        },
      ],
    },
    {
      title: "Общий срок",
      dataIndex: "total_deadline_days",
      width: 120,
      render: (value: number) =>
        `${value} дн.`,
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
                openEditModal(policy)
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
                deleteMutation.variables ===
                  policy.id
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

  if (
    currentUser !== undefined &&
    !canRead
  ) {
    return (
      <Alert
        type="error"
        message="Недостаточно прав"
        description="Нет разрешения onboarding.read"
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
            Правила адаптации
          </Typography.Title>

          <Typography.Text type="secondary">
            Расчёт плановых сроков этапов
            адаптации по категориям должностей
          </Typography.Text>
        </div>

        {policiesQuery.error && (
          <Alert
            type="error"
            message="Не удалось загрузить правила"
            description={
              policiesQuery.error.message
            }
            showIcon
          />
        )}

        <Card
          extra={
            canCreate ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
              >
                Добавить правило
              </Button>
            ) : null
          }
        >
          <Space
            orientation="vertical"
            size="middle"
            style={{ width: "100%" }}
          >
            <Select
              allowClear
              placeholder="Все категории"
              value={selectedCategory}
              options={
                positionCategoryOptions
              }
              style={{ width: 280 }}
              onChange={setSelectedCategory}
            />

            <Table<AdaptationPolicy>
              rowKey="id"
              loading={
                policiesQuery.isLoading
              }
              columns={columns}
              dataSource={
                policiesQuery.data ?? []
              }
              scroll={{ x: 1700 }}
              pagination={false}
              locale={{
                emptyText:
                  "Правила адаптации не найдены",
              }}
            />
          </Space>
        </Card>
      </Space>

      <Modal
        title="Новое правило адаптации"
        open={createOpen}
        width={760}
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
          onFinish={(values) =>
            createMutation.mutate(
              toRequest(values),
            )
          }
        />
      </Modal>

      <Modal
        title="Редактирование правила"
        open={editingPolicy !== null}
        width={760}
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

  onFinish: (
    values: PolicyFormValues,
  ) => void;
};

function PolicyForm({
  form,
  onFinish,
}: PolicyFormProps) {
  return (
    <Form<PolicyFormValues>
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Space
        align="start"
        size="middle"
        style={{ width: "100%" }}
      >
        <Form.Item
          name="position_category"
          label="Категория должности"
          rules={[
            {
              required: true,
              message: "Выберите категорию",
            },
          ]}
          style={{ width: 250 }}
        >
          <Select
            placeholder="Категория"
            options={
              positionCategoryOptions
            }
          />
        </Form.Item>

        <Form.Item
          name="effective_from"
          label="Действует с"
          rules={[
            {
              required: true,
              message: "Укажите дату начала",
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

      <Typography.Title level={5}>
        Первый этап
      </Typography.Title>

      <Space align="start" size="middle">
        <DaysField
          name="stage_1_start_offset_days"
          label="Старт после ТУ"
          allowZero
        />

        <DaysField
          name="stage_1_duration_days"
          label="Продолжительность"
        />
      </Space>

      <Typography.Title level={5}>
        Второй этап
      </Typography.Title>

      <Space align="start" size="middle">
        <DaysField
          name="stage_2_red_offset_days"
          label="Старт при красном риске"
          allowZero
        />

        <DaysField
          name="stage_2_normal_offset_days"
          label="Старт без красного риска"
          allowZero
        />

        <DaysField
          name="stage_2_duration_days"
          label="Продолжительность"
        />
      </Space>

      <Typography.Title level={5}>
        Третий этап
      </Typography.Title>

      <Space align="start" size="middle">
        <DaysField
          name="stage_3_red_offset_days"
          label="Старт при красном риске"
          allowZero
        />

        <DaysField
          name="stage_3_normal_offset_days"
          label="Старт без красного риска"
          allowZero
        />

        <DaysField
          name="stage_3_duration_days"
          label="Продолжительность"
        />
      </Space>

      <DaysField
        name="total_deadline_days"
        label="Общий срок адаптации"
      />
    </Form>
  );
}

type DaysFieldName =
  | "stage_1_start_offset_days"
  | "stage_1_duration_days"
  | "stage_2_red_offset_days"
  | "stage_2_normal_offset_days"
  | "stage_2_duration_days"
  | "stage_3_red_offset_days"
  | "stage_3_normal_offset_days"
  | "stage_3_duration_days"
  | "total_deadline_days";

type DaysFieldProps = {
  name: DaysFieldName;
  label: string;
  allowZero?: boolean;
};

function DaysField({
  name,
  label,
  allowZero = false,
}: DaysFieldProps) {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={[
        {
          required: true,
          message: "Укажите количество дней",
        },
      ]}
    >
      <Space.Compact>
        <InputNumber
          min={allowZero ? 0 : 1}
          precision={0}
          style={{ width: 165 }}
        />

        <Button disabled>
          дн.
        </Button>
      </Space.Compact>
    </Form.Item>
  );
}