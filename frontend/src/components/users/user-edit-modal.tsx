"use client";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  App,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Tabs,
} from "antd";

import { UserCenters } from "./user-centers";
import { UserSubordinates } from "./user-subordinates";

import type { Role } from "@/lib/api/roles";
import {
  updateUser,
  USER_TYPE_OPTIONS,
  type UpdateUserRequest,
  type User,
  type UserType,
} from "@/lib/api/users";

type UserEditForm = {
  role_id: number;
  manager_id: number | null;
  user_type: UserType;
  is_active: boolean;
};

type UserEditModalProps = {
  user: User;
  users: User[];
  roles: Role[];
  rolesLoading: boolean;
  canUpdate: boolean;
  onClose: () => void;
};

export function UserEditModal({
  user,
  users,
  roles,
  rolesLoading,
  canUpdate,
  onClose,
}: UserEditModalProps) {
  const [form] = Form.useForm<UserEditForm>();

  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const managerOptions = [
    {
      value: 0,
      label: "Без руководителя",
    },
    ...users
      .filter(
        (candidate) => candidate.id !== user.id,
      )
      .map((candidate) => ({
        value: candidate.id,
        label: `${candidate.email} · ${candidate.role.name}`,
      })),
  ];

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) =>
      updateUser(user.id, data),

    onSuccess: async () => {
      message.success("Пользователь обновлён");

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["users"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["current-user"],
        }),
      ]);

      onClose();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const generalTab = (
    <Form<UserEditForm>
      form={form}
      layout="vertical"
        initialValues={{
          role_id: user.role.id,
          manager_id: user.manager_id ?? 0,
          user_type: user.user_type,
          is_active: user.is_active,
        }}
      onFinish={(values) => {
        updateMutation.mutate({
          role_id: values.role_id,
          manager_id:
            values.manager_id === 0 ||
            values.manager_id === undefined
              ? null
              : values.manager_id,
          user_type: values.user_type,
          is_active: values.is_active,
        });
      }}
    >
      <Form.Item label="Пользователь">
        <Input
          value={user.email}
          disabled
        />
      </Form.Item>

      <Form.Item label="ФИО">
        <Input
          value={user.full_name ?? ""}
          disabled
        />
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
            disabled={!canUpdate}
            placeholder="Выберите тип пользователя"
            options={USER_TYPE_OPTIONS}
          />
        </Form.Item>
        <Select
          disabled={!canUpdate}
          loading={rolesLoading}
          placeholder="Выберите роль"
          options={roles.map((role) => ({
            value: role.id,
            label: role.name,
          }))}
        />
      </Form.Item>

      <Form.Item
        label="Непосредственный руководитель"
        name="manager_id"
      >
        <Select
          disabled={!canUpdate}
          showSearch
          optionFilterProp="label"
          placeholder="Без руководителя"
          options={managerOptions}
        />
      </Form.Item>

      <Form.Item
        label="Активен"
        name="is_active"
        valuePropName="checked"
      >
        <Switch disabled={!canUpdate} />
      </Form.Item>
    </Form>
  );

  return (
    <Modal
      title={`Пользователь: ${user.email}`}
      open
      width={900}
      okText="Сохранить"
      cancelText="Закрыть"
      confirmLoading={updateMutation.isPending}
      okButtonProps={{
        style: canUpdate
          ? undefined
          : { display: "none" },
      }}
      onOk={() => {
        if (canUpdate) {
          form.submit();
        }
      }}
      onCancel={onClose}
      afterClose={() => form.resetFields()}
    >
      <Tabs
        defaultActiveKey="general"
        items={[
          {
            key: "general",
            label: "Основное",
            children: generalTab,
          },
          {
            key: "centers",
            label: "Распределительные центры",
            children: (
              <UserCenters
                userId={user.id}
                canUpdate={canUpdate}
              />
            ),
          },
          {
            key: "subordinates",
            label: "Подчинённые",
            children: (
              <UserSubordinates
                userId={user.id}
              />
            ),
          },
        ]}
      />
    </Modal>
  );
}