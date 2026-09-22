"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Table,
  Tag,
} from "antd";

import {
  getUserSubordinates,
  type User,
} from "@/lib/api/users";

type UserSubordinatesProps = {
  userId: number;
};

export function UserSubordinates({
  userId,
}: UserSubordinatesProps) {
  const subordinatesQuery = useQuery({
    queryKey: [
      "users",
      userId,
      "subordinates",
    ],
    queryFn: () =>
      getUserSubordinates(userId),
  });

  if (subordinatesQuery.error) {
    return (
      <Alert
        type="error"
        message="Не удалось загрузить подчинённых"
        description={
          subordinatesQuery.error.message
        }
        showIcon
      />
    );
  }

  return (
    <Table<User>
      rowKey="id"
      loading={subordinatesQuery.isLoading}
      dataSource={subordinatesQuery.data ?? []}
      pagination={false}
      locale={{
        emptyText:
          "Непосредственных подчинённых нет",
      }}
      columns={[
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
          title: "Статус",
          dataIndex: "is_active",
          width: 130,
          render: (isActive: boolean) =>
            isActive ? (
              <Tag color="success">Активен</Tag>
            ) : (
              <Tag>Отключён</Tag>
            ),
        },
      ]}
    />
  );
}