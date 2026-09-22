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
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Typography,
} from "antd";

import type { OrganizationPermissions } from "@/components/organization/types";
import {
  createDivision,
  deleteDivision,
  getDivisionGroups,
  getDivisions,
  updateDivision,
  type CreateDivisionRequest,
  type Division,
} from "@/lib/api/organization";

type DivisionsTableProps = {
  permissions: OrganizationPermissions;
};

export function DivisionsTable({
  permissions,
}: DivisionsTableProps) {
  const [selectedGroupId, setSelectedGroupId] =
    useState<number>();

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [editingDivision, setEditingDivision] =
    useState<Division | null>(null);

  const [createForm] =
    Form.useForm<CreateDivisionRequest>();

  const [editForm] =
    Form.useForm<CreateDivisionRequest>();

  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: ["organization", "division-groups"],
    queryFn: getDivisionGroups,
  });

  const divisionsQuery = useQuery({
    queryKey: [
      "organization",
      "divisions",
      selectedGroupId ?? "all",
    ],
    queryFn: () => getDivisions(selectedGroupId),
  });

  const groupById = new Map(
    (groupsQuery.data ?? []).map((group) => [
      group.id,
      group,
    ]),
  );

  const invalidateOrganization = () =>
    queryClient.invalidateQueries({
      queryKey: ["organization"],
    });

    const createMutation = useMutation({
      mutationFn: createDivision,

      onSuccess: async () => {
        message.success("Подразделение создано");

        setIsCreateOpen(false);
        createForm.resetFields();

        await Promise.all([
          invalidateOrganization(),

          queryClient.invalidateQueries({
            queryKey: ["notifications"],
          }),
        ]);
      },

  onError: (error) => {
    message.error(error.message);
  },
});

  const updateMutation = useMutation({
    mutationFn: ({
      divisionId,
      data,
    }: {
      divisionId: number;
      data: CreateDivisionRequest;
    }) => updateDivision(divisionId, data),

    onSuccess: async () => {
      message.success("Подразделение обновлено");

      setEditingDivision(null);
      editForm.resetFields();

      await invalidateOrganization();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDivision,

    onSuccess: async () => {
      message.success("Подразделение удалено");
      await invalidateOrganization();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const openCreateModal = () => {
    createForm.setFieldsValue({
      division_group_id: selectedGroupId,
    });

    setIsCreateOpen(true);
  };

  const openEditModal = (division: Division) => {
    setEditingDivision(division);

    editForm.setFieldsValue({
      division_group_id:
        division.division_group_id,
      name: division.name,
    });
  };

  const confirmDelete = (division: Division) => {
    modal.confirm({
      title: "Удалить подразделение?",
      content: (
        <>
          Подразделение{" "}
          <Typography.Text strong>
            {division.name}
          </Typography.Text>{" "}
          будет удалено из глобального справочника.
        </>
      ),
      okText: "Удалить",
      cancelText: "Отмена",
      okType: "danger",
      onOk: () =>
        deleteMutation.mutateAsync(division.id),
    });
  };

  if (groupsQuery.error) {
    return (
      <Alert
        type="error"
        message="Не удалось загрузить группы"
        description={groupsQuery.error.message}
        showIcon
      />
    );
  }

  if (divisionsQuery.error) {
    return (
      <Alert
        type="error"
        message="Не удалось загрузить подразделения"
        description={divisionsQuery.error.message}
        showIcon
      />
    );
  }

  return (
    <>
      <Card
        title="Глобальные подразделения"
        extra={
          permissions.canCreate ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Добавить подразделение
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
            showSearch
            optionFilterProp="label"
            placeholder="Все группы"
            value={selectedGroupId}
            loading={groupsQuery.isLoading}
            style={{ width: "100%", maxWidth: 500 }}
            onChange={(groupId) =>
              setSelectedGroupId(groupId)
            }
            options={groupsQuery.data?.map(
              (group) => ({
                value: group.id,
                label: `${group.abbreviation} — ${group.name}`,
              }),
            )}
          />

          <Table<Division>
            rowKey="id"
            loading={divisionsQuery.isLoading}
            dataSource={divisionsQuery.data ?? []}
            pagination={false}
            columns={[
              {
                title: "Подразделение",
                dataIndex: "name",
              },
              {
                title: "Группа",
                dataIndex: "division_group_id",
                render: (groupId: number) => {
                  const group = groupById.get(groupId);

                  return group
                    ? `${group.abbreviation} — ${group.name}`
                    : `ID ${groupId}`;
                },
              },
              {
                title: "Действия",
                key: "actions",
                width: 210,
                render: (_, division) => (
                  <Space>
                    {permissions.canUpdate && (
                      <Button
                        icon={<EditOutlined />}
                        onClick={() =>
                          openEditModal(division)
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
                            division.id
                        }
                        onClick={() =>
                          confirmDelete(division)
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
        title="Новое подразделение"
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
        <DivisionForm
          form={createForm}
          groups={groupsQuery.data ?? []}
          onFinish={(values) =>
            createMutation.mutate(values)
          }
        />
      </Modal>

      <Modal
        title="Редактирование подразделения"
        open={editingDivision !== null}
        forceRender
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={updateMutation.isPending}
        onOk={() => editForm.submit()}
        onCancel={() => {
          setEditingDivision(null);
          editForm.resetFields();
        }}
      >
        <DivisionForm
          form={editForm}
          groups={groupsQuery.data ?? []}
          onFinish={(values) => {
            if (!editingDivision) {
              return;
            }

            updateMutation.mutate({
              divisionId: editingDivision.id,
              data: values,
            });
          }}
        />
      </Modal>
    </>
  );
}

type DivisionFormProps = {
  form: ReturnType<
    typeof Form.useForm<CreateDivisionRequest>
  >[0];
  groups: Array<{
    id: number;
    name: string;
    abbreviation: string;
  }>;
  onFinish: (
    values: CreateDivisionRequest,
  ) => void;
};

function DivisionForm({
  form,
  groups,
  onFinish,
}: DivisionFormProps) {
  return (
    <Form<CreateDivisionRequest>
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        label="Группа подразделений"
        name="division_group_id"
        rules={[
          {
            required: true,
            message: "Выберите группу",
          },
        ]}
      >
        <Select
          showSearch
          optionFilterProp="label"
          placeholder="Выберите группу"
          options={groups.map((group) => ({
            value: group.id,
            label: `${group.abbreviation} — ${group.name}`,
          }))}
        />
      </Form.Item>

      <Form.Item
        label="Название"
        name="name"
        rules={[
          {
            required: true,
            message: "Введите название подразделения",
          },
          {
            max: 128,
            message: "Максимум 128 символов",
          },
        ]}
      >
        <Input placeholder="Отдел комплектации и отгрузки товара" />
      </Form.Item>
    </Form>
  );
}