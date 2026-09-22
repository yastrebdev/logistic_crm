"use client";

import { EditOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";

import {
  getPermissions,
  getRoles,
  updateRole,
  type Permission,
  type Role,
} from "@/lib/api/roles";

import { useCurrentUser } from "@/hooks/use-current-user";
import { hasPermission } from "@/lib/permissions";
import {
  getPermissionParts,
  permissionActionLabels,
  permissionResourceLabels,
} from "@/lib/permission-labels";

export default function RolesPage() {
    const {
      data: permissions,
      isLoading: permissionsLoading,
    } = useQuery({
      queryKey: ["permissions"],
      queryFn: getPermissions,
    });

  const updateRoleMutation = useMutation({
      mutationFn: ({
        roleId,
        permissionIds,
      }: {
        roleId: number;
        permissionIds: number[];
      }) =>
        updateRole(roleId, {
          permission_ids: permissionIds,
        }),

      onSuccess: async () => {
        message.success("Права роли обновлены");

        setEditingRole(null);
        setSelectedPermissionIds([]);

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["roles"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["current-user"],
          }),
        ]);
      },

      onError: (error) => {
        message.error(error.message);
      },
    });

    const openEditRoleModal = (role: Role) => {
      setEditingRole(role);

      setSelectedPermissionIds(
        role.permissions.map(
          (permission) => permission.id
        )
      );
    };

  const {
    data: roles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: getRoles,
  });

    const { message } = App.useApp();

    const queryClient = useQueryClient();

    const { data: currentUser } =
      useCurrentUser();

    const [editingRole, setEditingRole] =
      useState<Role | null>(null);

    const [selectedPermissionIds, setSelectedPermissionIds] =
      useState<number[]>([]);

  const canUpdateRoles =
      currentUser &&
      hasPermission(
        currentUser.permissions,
        "roles.update",
      );

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Не удалось загрузить роли"
        description={error.message}
        showIcon
      />
    );
  }

    const groupedPermissions =
      permissions?.reduce<
        Record<string, Permission[]>
      >((groups, permission) => {
        const { resource } =
          getPermissionParts(permission.name);

        if (!groups[resource]) {
          groups[resource] = [];
        }

        groups[resource].push(permission);

        return groups;
      }, {}) ?? {};

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
              Роли
            </Typography.Title>

            <Typography.Text type="secondary">
              Управление ролями и правами доступа
            </Typography.Text>
          </div>

          <Card>
            <Table
              rowKey="id"
              dataSource={roles ?? []}
              pagination={false}
              columns={[
                {
                  title: "ID",
                  dataIndex: "id",
                  width: 80,
                },
                {
                  title: "Роль",
                  dataIndex: "name",
                  width: 200,
                  render: (name: string) => (
                    <Typography.Text strong>
                      {name}
                    </Typography.Text>
                  ),
                },
                {
                  title: "Права",
                  dataIndex: "permissions",
                  render: (
                      permissions: Permission[],
                    ) => (
                      <Space wrap>
                        {permissions.length > 0 ? (
                          permissions.map((permission) => {
                            const {
                              resource,
                              action,
                            } = getPermissionParts(
                              permission.name,
                            );

                            return (
                              <Tag key={permission.id}>
                                {permissionResourceLabels[
                                  resource
                                ] ?? resource}
                                {" — "}
                                {permissionActionLabels[
                                  action
                                ] ?? action}
                              </Tag>
                            );
                          })
                        ) : (
                          <Typography.Text type="secondary">
                            Нет прав
                          </Typography.Text>
                        )}
                      </Space>
                    )
                },
                {
                  title: "Действия",
                  key: "actions",
                  width: 140,
                  render: (_, role: Role) =>
                    canUpdateRoles ? (
                      <Button
                        icon={<EditOutlined />}
                        disabled={role.name === "admin"}
                        onClick={() =>
                          openEditRoleModal(role)
                        }
                      >
                        Изменить
                      </Button>
                    ) : null,
                },
              ]}
            />
          </Card>
        </Space>
        <Modal
          title={
            editingRole
              ? `Права роли: ${editingRole.name}`
              : "Права роли"
          }
          open={editingRole !== null}
          onCancel={() => {
            setEditingRole(null);
            setSelectedPermissionIds([]);
          }}
          onOk={() => {
            if (!editingRole) {
              return;
            }

            updateRoleMutation.mutate({
              roleId: editingRole.id,
              permissionIds:
                selectedPermissionIds,
            });
          }}
          confirmLoading={
            updateRoleMutation.isPending
          }
          okText="Сохранить"
          cancelText="Отмена"
        >
          {permissionsLoading ? (
            <Typography.Text>
              Загрузка...
            </Typography.Text>
          ) : (
            <Checkbox.Group
              value={selectedPermissionIds}
              onChange={(values) =>
                setSelectedPermissionIds(
                  values as number[],
                )
              }
              style={{ width: "100%" }}
            >
              <Space
                orientation="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                {Object.entries(
                  groupedPermissions,
                ).map(
                  ([
                    resource,
                    resourcePermissions,
                  ]) => (
                    <div key={resource}>
                      <Typography.Title
                        level={5}
                        style={{ marginBottom: 12 }}
                      >
                        {permissionResourceLabels[
                          resource
                        ] ?? resource}
                      </Typography.Title>

                      <Space orientation="vertical">
                        {resourcePermissions.map(
                          (permission) => {
                            const { action } =
                              getPermissionParts(
                                permission.name,
                              );

                            return (
                              <Checkbox
                                key={permission.id}
                                value={permission.id}
                              >
                                {permissionActionLabels[
                                  action
                                ] ?? action}
                              </Checkbox>
                            );
                          },
                        )}
                      </Space>
                    </div>
                  ),
                )}
              </Space>
            </Checkbox.Group>
          )}
        </Modal>
    </>
  );
}