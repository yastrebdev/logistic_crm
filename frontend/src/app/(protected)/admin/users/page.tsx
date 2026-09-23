"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";

import { UserEditModal } from "@/components/users/user-edit-modal";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getRoles } from "@/lib/api/roles";
import {
  createUser,
  getUsers,
  USER_TYPE_LABELS,
  USER_TYPE_OPTIONS,
  type CreateUserRequest,
  type User,
  type UserType,
} from "@/lib/api/users";
import { hasPermission } from "@/lib/permissions";

type CreateUserForm = {
  email: string;
  full_name: string;
  password: string;
  role_id: number;
  manager_id: number | null;
  user_type: UserType;
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [createForm] =
    Form.useForm<CreateUserForm>();

  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  const canCreate =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "users.create",
    );

  const canUpdate =
    currentUser !== undefined &&
    hasPermission(
      currentUser.permissions,
      "users.update",
    );

  const usersQuery = useQuery({
    queryKey: ["users", "list", page, pageSize],
    queryFn: () => getUsers(page, pageSize),
  });

  const managerCandidatesQuery = useQuery({
    queryKey: ["users", "manager-candidates"],
    queryFn: () => getUsers(1, 100),
  });

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

  const managerById = useMemo(
    () =>
      new Map(
        (
          managerCandidatesQuery.data?.items ?? []
        ).map((user) => [user.id, user]),
      ),
    [managerCandidatesQuery.data],
  );

  const createMutation = useMutation({
    mutationFn: createUser,

    onSuccess: async () => {
      message.success("Пользователь создан");

      setIsCreateOpen(false);
      createForm.resetFields();

      await queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const error =
    usersQuery.error ||
    managerCandidatesQuery.error ||
    rolesQuery.error;

  if (error) {
    return (
      <Alert
        type="error"
        message="Не удалось загрузить пользователей"
        description={error.message}
        showIcon
      />
    );
  }

  return (
    <>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <Typography.Title
          level={2}
          style={{ margin: 0 }}
        >
          Пользователи
        </Typography.Title>

        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              setIsCreateOpen(true)
            }
          >
            Создать пользователя
          </Button>
        )}
      </Space>

      <Table<User>
        rowKey="id"
        loading={usersQuery.isLoading}
        dataSource={usersQuery.data?.items ?? []}
        pagination={{
          current: usersQuery.data?.page ?? page,
          pageSize:
            usersQuery.data?.page_size ?? pageSize,
          total: usersQuery.data?.total ?? 0,
          showSizeChanger: false,
          onChange: setPage,
        }}
        columns={[
          {
            title: "ID",
            dataIndex: "id",
            width: 80,
          },
          {
            title: "Email",
            dataIndex: "email",
          },
          {
            title: "Роль",
            dataIndex: ["role", "name"],
            width: 180,
          },
          {
            title: "Руководитель",
            dataIndex: "manager_id",
            render: (
              managerId: number | null,
            ) => {
              if (managerId === null) {
                return "Без руководителя";
              }

              return (
                managerById.get(managerId)?.email ??
                `Пользователь #${managerId}`
              );
            },
          },
          {
            title: "Статус",
            dataIndex: "is_active",
            width: 130,
            render: (isActive: boolean) =>
              isActive ? (
                <Tag color="success">
                  Активен
                </Tag>
              ) : (
                <Tag>Отключён</Tag>
              ),
          },
          {
              title: "Тип пользователя",
              dataIndex: "user_type",
              width: 230,
              render: (userType: UserType) =>
                USER_TYPE_LABELS[userType] ?? userType,
            },
          {
            title: "Действия",
            key: "actions",
            width: 150,
            render: (_, user) => (
              <Button
                icon={<SettingOutlined />}
                onClick={() =>
                  setSelectedUser(user)
                }
              >
                Открыть
              </Button>
            ),
          },
        ]}
      />

      <Modal
        title="Создание пользователя"
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
        <Form<CreateUserForm>
          form={createForm}
          layout="vertical"
            initialValues={{
              manager_id: 0,
              user_type: "Training Manager",
            }}
          onFinish={(values) => {
                const request: CreateUserRequest = {
                  email: values.email,
                  full_name: values.full_name,
                  password: values.password,
                  role_id: values.role_id,
                  manager_id:
                    values.manager_id === 0 ||
                    values.manager_id === undefined
                      ? null
                      : values.manager_id,
                  user_type: values.user_type,
                };
            createMutation.mutate(request);
          }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Введите email",
              },
              {
                type: "email",
                message: "Некорректный email",
              },
            ]}
          >
            <Input placeholder="user@company.ru" />
          </Form.Item>

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
            <Input placeholder="Иванов Иван Иванович" />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              {
                required: true,
                message: "Введите пароль",
              },
              {
                min: 8,
                message: "Минимум 8 символов",
              },
              {
                max: 128,
                message: "Максимум 128 символов",
              },
            ]}
          >
            <Input.Password />
          </Form.Item>

            <Form.Item
              label="Роль"
              name="role_id"
              rules={[
                {
                  required: true,
                  message: "Выберите роль",
                },
              ]}
            >
              <Select
                loading={rolesQuery.isLoading}
                placeholder="Выберите роль"
                options={rolesQuery.data?.map(
                  (role) => ({
                    value: role.id,
                    label: role.name,
                  }),
                )}
              />
            </Form.Item>

            <Form.Item
              label="Тип пользователя"
              name="user_type"
              rules={[
                {
                  required: true,
                  message: "Выберите тип пользователя",
                },
              ]}
            >
              <Select
                placeholder="Выберите тип пользователя"
                options={USER_TYPE_OPTIONS}
              />
            </Form.Item>

          <Form.Item
            label="Непосредственный руководитель"
            name="manager_id"
          >
            <Select
              loading={
                managerCandidatesQuery.isLoading
              }
              showSearch
              optionFilterProp="label"
              placeholder="Без руководителя"
              options={[
                {
                  value: 0,
                  label: "Без руководителя",
                },
                ...(
                  managerCandidatesQuery.data
                    ?.items ?? []
                ).map((user) => ({
                  value: user.id,
                  label: `${user.email} · ${user.role.name}`,
                })),
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {selectedUser && (
        <UserEditModal
          key={selectedUser.id}
          user={selectedUser}
          users={
            managerCandidatesQuery.data?.items ??
            []
          }
          roles={rolesQuery.data ?? []}
          rolesLoading={rolesQuery.isLoading}
          canUpdate={canUpdate}
          onClose={() =>
            setSelectedUser(null)
          }
        />
      )}
    </>
  );
}