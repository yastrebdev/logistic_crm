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
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";

import type { OrganizationPermissions } from "@/components/organization/types";
import {
  createPosition,
  deletePosition,
  getDivisionGroups,
  getDivisions,
  getPositions,
  updatePosition,
  type CreatePositionRequest,
  type Division,
  type Position,
  type PositionCategory,
} from "@/lib/api/organization";

type PositionsTableProps = {
  permissions: OrganizationPermissions;
};

const positionCategoryLabels: Record<
  PositionCategory,
  string
> = {
  line_staff: "Линейный персонал",
  specialist: "Специалист",
  manager: "Руководитель",
  head: "Директор",
};

const positionCategoryOptions = Object.entries(
  positionCategoryLabels,
).map(([value, label]) => ({
  value,
  label,
}));

export function PositionsTable({
  permissions,
}: PositionsTableProps) {
  const [selectedGroupId, setSelectedGroupId] =
    useState<number>();

  const [selectedDivisionId, setSelectedDivisionId] =
    useState<number>();

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [editingPosition, setEditingPosition] =
    useState<Position | null>(null);

  const [createForm] =
    Form.useForm<CreatePositionRequest>();

  const [editForm] =
    Form.useForm<CreatePositionRequest>();

  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: ["organization", "division-groups"],
    queryFn: getDivisionGroups,
  });

  const divisionsQuery = useQuery({
    queryKey: ["organization", "divisions", "all"],
    queryFn: () => getDivisions(),
  });

  const positionsQuery = useQuery({
    queryKey: [
      "organization",
      "positions",
      selectedDivisionId ?? "all",
    ],
    queryFn: () =>
      getPositions(selectedDivisionId),
  });

  const groupById = useMemo(
    () =>
      new Map(
        (groupsQuery.data ?? []).map((group) => [
          group.id,
          group,
        ]),
      ),
    [groupsQuery.data],
  );

  const divisionById = useMemo(
    () =>
      new Map(
        (divisionsQuery.data ?? []).map((division) => [
          division.id,
          division,
        ]),
      ),
    [divisionsQuery.data],
  );

  const availableDivisions = useMemo(() => {
    const divisions = divisionsQuery.data ?? [];

    if (selectedGroupId === undefined) {
      return divisions;
    }

    return divisions.filter(
      (division) =>
        division.division_group_id ===
        selectedGroupId,
    );
  }, [divisionsQuery.data, selectedGroupId]);

  const visiblePositions = useMemo(() => {
    const positions = positionsQuery.data ?? [];

    if (
      selectedGroupId === undefined ||
      selectedDivisionId !== undefined
    ) {
      return positions;
    }

    const divisionIds = new Set(
      availableDivisions.map(
        (division) => division.id,
      ),
    );

    return positions.filter((position) =>
      divisionIds.has(position.division_id),
    );
  }, [
    positionsQuery.data,
    selectedGroupId,
    selectedDivisionId,
    availableDivisions,
  ]);

  const invalidateOrganization = () =>
    queryClient.invalidateQueries({
      queryKey: ["organization"],
    });

  const createMutation = useMutation({
    mutationFn: createPosition,

    onSuccess: async () => {
      message.success("Должность создана");

      setIsCreateOpen(false);
      createForm.resetFields();

      await invalidateOrganization();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      positionId,
      data,
    }: {
      positionId: number;
      data: CreatePositionRequest;
    }) => updatePosition(positionId, data),

    onSuccess: async () => {
      message.success("Должность обновлена");

      setEditingPosition(null);
      editForm.resetFields();

      await invalidateOrganization();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePosition,

    onSuccess: async () => {
      message.success("Должность удалена");
      await invalidateOrganization();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const openCreateModal = () => {
    createForm.setFieldsValue({
      division_id: selectedDivisionId,
    });

    setIsCreateOpen(true);
  };

  const openEditModal = (position: Position) => {
    setEditingPosition(position);

    editForm.setFieldsValue({
      division_id: position.division_id,
      name: position.name,
      category: position.category,
    });
  };

  const confirmDelete = (position: Position) => {
    modal.confirm({
      title: "Удалить должность?",
      content: (
        <>
          Должность{" "}
          <Typography.Text strong>
            {position.name}
          </Typography.Text>{" "}
          будет удалена из глобального справочника.
        </>
      ),
      okText: "Удалить",
      cancelText: "Отмена",
      okType: "danger",
      onOk: () =>
        deleteMutation.mutateAsync(position.id),
    });
  };

  const queryError =
    groupsQuery.error ||
    divisionsQuery.error ||
    positionsQuery.error;

  if (queryError) {
    return (
      <Alert
        type="error"
        message="Не удалось загрузить должности"
        description={queryError.message}
        showIcon
      />
    );
  }

  return (
    <>
      <Card
        title="Глобальные должности"
        extra={
          permissions.canCreate ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Добавить должность
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
              loading={groupsQuery.isLoading}
              style={{ width: 320 }}
              onChange={(groupId) => {
                setSelectedGroupId(groupId);
                setSelectedDivisionId(undefined);
              }}
              options={groupsQuery.data?.map(
                (group) => ({
                  value: group.id,
                  label: `${group.abbreviation} — ${group.name}`,
                }),
              )}
            />

            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Все подразделения"
              value={selectedDivisionId}
              loading={divisionsQuery.isLoading}
              style={{ width: 420 }}
              onChange={(divisionId) =>
                setSelectedDivisionId(divisionId)
              }
              options={availableDivisions.map(
                (division) => ({
                  value: division.id,
                  label: division.name,
                }),
              )}
            />
          </Space>

          <Table<Position>
            rowKey="id"
            loading={positionsQuery.isLoading}
            dataSource={visiblePositions}
            pagination={false}
            columns={[
              {
                title: "Должность",
                dataIndex: "name",
              },
              {
                title: "Подразделение",
                dataIndex: "division_id",
                render: (divisionId: number) =>
                  divisionById.get(divisionId)
                    ?.name ?? `ID ${divisionId}`,
              },
              {
                title: "Группа",
                dataIndex: "division_id",
                render: (divisionId: number) => {
                  const division =
                    divisionById.get(divisionId);

                  const group = division
                    ? groupById.get(
                        division.division_group_id,
                      )
                    : undefined;

                  return group
                    ? `${group.abbreviation} — ${group.name}`
                    : "—";
                },
              },
              {
                title: "Категория",
                dataIndex: "category",
                width: 190,
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
                title: "Действия",
                key: "actions",
                width: 210,
                render: (_, position) => (
                  <Space>
                    {permissions.canUpdate && (
                      <Button
                        icon={<EditOutlined />}
                        onClick={() =>
                          openEditModal(position)
                        }
                      >
                        Изменить
                      </Button>
                    )}

                    {permissions.canDelete && (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        loading={
                          deleteMutation.isPending &&
                          deleteMutation.variables ===
                            position.id
                        }
                        onClick={() =>
                          confirmDelete(position)
                        }
                      />
                    )}
                  </Space>
                ),
              },
            ]}
          />
        </Space>
      </Card>

      <Modal
        title="Новая должность"
        open={isCreateOpen}
        forceRender
        okText="Создать"
        cancelText="Отмена"
        confirmLoading={createMutation.isPending}
        onOk={() => createForm.submit()}
        onCancel={() => {
          setIsCreateOpen(false);
          createForm.resetFields();
        }}
      >
        <PositionForm
          form={createForm}
          divisions={divisionsQuery.data ?? []}
          groupById={groupById}
          onFinish={(values) =>
            createMutation.mutate(values)
          }
        />
      </Modal>

      <Modal
        title="Редактирование должности"
        open={editingPosition !== null}
        forceRender
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={updateMutation.isPending}
        onOk={() => editForm.submit()}
        onCancel={() => {
          setEditingPosition(null);
          editForm.resetFields();
        }}
      >
        <PositionForm
          form={editForm}
          divisions={divisionsQuery.data ?? []}
          groupById={groupById}
          onFinish={(values) => {
            if (!editingPosition) {
              return;
            }

            updateMutation.mutate({
              positionId: editingPosition.id,
              data: values,
            });
          }}
        />
      </Modal>
    </>
  );
}

type PositionFormProps = {
  form: ReturnType<
    typeof Form.useForm<CreatePositionRequest>
  >[0];
  divisions: Division[];
  groupById: Map<
    number,
    {
      id: number;
      name: string;
      abbreviation: string;
    }
  >;
  onFinish: (
    values: CreatePositionRequest,
  ) => void;
};

function PositionForm({
  form,
  divisions,
  groupById,
  onFinish,
}: PositionFormProps) {
  return (
    <Form<CreatePositionRequest>
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        label="Подразделение"
        name="division_id"
        rules={[
          {
            required: true,
            message: "Выберите подразделение",
          },
        ]}
      >
        <Select
          showSearch
          optionFilterProp="label"
          placeholder="Выберите подразделение"
          options={divisions.map((division) => {
            const group = groupById.get(
              division.division_group_id,
            );

            return {
              value: division.id,
              label: group
                ? `${group.abbreviation} · ${division.name}`
                : division.name,
            };
          })}
        />
      </Form.Item>

      <Form.Item
        label="Название"
        name="name"
        rules={[
          {
            required: true,
            message: "Введите название должности",
          },
          {
            max: 128,
            message: "Максимум 128 символов",
          },
        ]}
      >
        <Input placeholder="Комплектовщик" />
      </Form.Item>

      <Form.Item
        label="Категория"
        name="category"
        rules={[
          {
            required: true,
            message: "Выберите категорию",
          },
        ]}
      >
        <Select
          placeholder="Выберите категорию"
          options={positionCategoryOptions}
        />
      </Form.Item>
    </Form>
  );
}