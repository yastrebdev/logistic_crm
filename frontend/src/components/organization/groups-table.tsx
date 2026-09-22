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
  Space,
  Table,
  Typography,
} from "antd";

import type { OrganizationPermissions } from "@/components/organization/types";
import {
  createDivisionGroup,
  deleteDivisionGroup,
  getDivisionGroups,
  updateDivisionGroup,
  type CreateDivisionGroupRequest,
  type DivisionGroup,
} from "@/lib/api/organization";

type GroupsTableProps = {
  permissions: OrganizationPermissions;
};

export function GroupsTable({
  permissions,
}: GroupsTableProps) {
  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [editingGroup, setEditingGroup] =
    useState<DivisionGroup | null>(null);

  const [createForm] =
    Form.useForm<CreateDivisionGroupRequest>();

  const [editForm] =
    Form.useForm<CreateDivisionGroupRequest>();

  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: ["organization", "division-groups"],
    queryFn: getDivisionGroups,
  });

  const invalidateGroups = () =>
    queryClient.invalidateQueries({
      queryKey: ["organization"],
    });

  const createMutation = useMutation({
    mutationFn: createDivisionGroup,

    onSuccess: async () => {
      message.success("Группа создана");

      setIsCreateOpen(false);
      createForm.resetFields();

      await invalidateGroups();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      groupId,
      data,
    }: {
      groupId: number;
      data: CreateDivisionGroupRequest;
    }) => updateDivisionGroup(groupId, data),

    onSuccess: async () => {
      message.success("Группа обновлена");

      setEditingGroup(null);
      editForm.resetFields();

      await invalidateGroups();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDivisionGroup,

    onSuccess: async () => {
      message.success("Группа удалена");
      await invalidateGroups();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const openEditModal = (group: DivisionGroup) => {
    setEditingGroup(group);

    editForm.setFieldsValue({
      code: group.code,
      name: group.name,
      abbreviation: group.abbreviation,
    });
  };

  const confirmDelete = (group: DivisionGroup) => {
    modal.confirm({
      title: "Удалить группу?",
      content: (
        <>
          Группа{" "}
          <Typography.Text strong>
            {group.abbreviation} — {group.name}
          </Typography.Text>{" "}
          будет удалена.
        </>
      ),
      okText: "Удалить",
      cancelText: "Отмена",
      okType: "danger",
      onOk: () =>
        deleteMutation.mutateAsync(group.id),
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

  return (
    <>
      <Card
        title="Группы подразделений"
        extra={
          permissions.canCreate ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateOpen(true)}
            >
              Добавить группу
            </Button>
          ) : null
        }
      >
        <Table<DivisionGroup>
          rowKey="id"
          loading={groupsQuery.isLoading}
          dataSource={groupsQuery.data ?? []}
          pagination={false}
          columns={[
            {
              title: "Код",
              dataIndex: "code",
              width: 220,
            },
            {
              title: "Сокращение",
              dataIndex: "abbreviation",
              width: 160,
            },
            {
              title: "Название",
              dataIndex: "name",
            },
            {
              title: "Действия",
              key: "actions",
              width: 210,
              render: (_, group) => (
                <Space>
                  {permissions.canUpdate && (
                    <Button
                      icon={<EditOutlined />}
                      onClick={() =>
                        openEditModal(group)
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
                          group.id
                      }
                      onClick={() =>
                        confirmDelete(group)
                      }
                    />
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Новая группа подразделений"
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
        <GroupForm
          form={createForm}
          onFinish={(values) =>
            createMutation.mutate(values)
          }
        />
      </Modal>

      <Modal
        title="Редактирование группы"
        open={editingGroup !== null}
        forceRender
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={updateMutation.isPending}
        onOk={() => editForm.submit()}
        onCancel={() => {
          setEditingGroup(null);
          editForm.resetFields();
        }}
      >
        <GroupForm
          form={editForm}
          onFinish={(values) => {
            if (!editingGroup) {
              return;
            }

            updateMutation.mutate({
              groupId: editingGroup.id,
              data: values,
            });
          }}
        />
      </Modal>
    </>
  );
}

type GroupFormProps = {
  form: ReturnType<
    typeof Form.useForm<CreateDivisionGroupRequest>
  >[0];
  onFinish: (
    values: CreateDivisionGroupRequest,
  ) => void;
};

function GroupForm({
  form,
  onFinish,
}: GroupFormProps) {
  return (
    <Form<CreateDivisionGroupRequest>
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        label="Код"
        name="code"
        rules={[
          {
            required: true,
            message: "Введите код группы",
          },
          {
            max: 50,
            message: "Максимум 50 символов",
          },
        ]}
      >
        <Input placeholder="PICKING_AND_SHIPPING" />
      </Form.Item>

      <Form.Item
        label="Название"
        name="name"
        rules={[
          {
            required: true,
            message: "Введите название группы",
          },
          {
            max: 150,
            message: "Максимум 150 символов",
          },
        ]}
      >
        <Input placeholder="Комплектация и отгрузка" />
      </Form.Item>

      <Form.Item
        label="Сокращение"
        name="abbreviation"
        rules={[
          {
            required: true,
            message: "Введите сокращение",
          },
          {
            max: 20,
            message: "Максимум 20 символов",
          },
        ]}
      >
        <Input placeholder="ОКиОТ" />
      </Form.Item>
    </Form>
  );
}