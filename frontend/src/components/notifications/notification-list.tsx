"use client";

import {
  Alert,
  Badge,
  Card,
  Empty,
  Pagination,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";

import type {
  AppNotification,
  NotificationType,
} from "@/lib/api/notifications";

type NotificationListProps = {
  notifications: AppNotification[];
  loading: boolean;
  error: Error | null;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onOpen: (
    notification: AppNotification,
  ) => void;
};

const notificationTypeLabels: Record<
  NotificationType,
  string
> = {
  system: "Система",
  administrative: "Административное",
  organization_updated: "Организация",
  deadline: "Срок",
  task_assigned: "Новая задача",
  task_updated: "Задача изменена",
  subordinate_action: "Подчинённый",
};

const notificationTypeColors: Record<
  NotificationType,
  string
> = {
  system: "default",
  administrative: "blue",
  organization_updated: "purple",
  deadline: "red",
  task_assigned: "green",
  task_updated: "cyan",
  subordinate_action: "orange",
};

const dateFormatter = new Intl.DateTimeFormat(
  "ru-RU",
  {
    dateStyle: "short",
    timeStyle: "short",
  },
);

export function NotificationList({
  notifications,
  loading,
  error,
  page,
  pageSize,
  total,
  onPageChange,
  onOpen,
}: NotificationListProps) {
  if (error) {
    return (
      <Alert
        type="error"
        title="Не удалось загрузить уведомления"
        description={error.message}
        showIcon
      />
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: 48,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Empty description="Уведомлений нет" />
    );
  }

  return (
    <Space
      orientation="vertical"
      size="middle"
      style={{ width: "100%" }}
    >
      {notifications.map((notification) => {
        const isUnread =
          notification.read_at === null;

        return (
          <Card
            key={notification.id}
            size="small"
            hoverable
            role="button"
            tabIndex={0}
            onClick={() => onOpen(notification)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                onOpen(notification);
              }
            }}
            style={{
              cursor: "pointer",
              background: isUnread
                ? "#e6f4ff"
                : undefined,
              borderColor: isUnread
                ? "#91caff"
                : undefined,
            }}
          >
            <Space
              orientation="vertical"
              size={6}
              style={{ width: "100%" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <Space size="small">
                  {isUnread && (
                    <Badge status="processing" />
                  )}

                  <Typography.Text
                    strong={isUnread}
                  >
                    {notification.title}
                  </Typography.Text>
                </Space>

                <Tag
                  color={
                    notificationTypeColors[
                      notification
                        .notification_type
                    ]
                  }
                >
                  {
                    notificationTypeLabels[
                      notification
                        .notification_type
                    ]
                  }
                </Tag>
              </div>

              <Typography.Text>
                {notification.message}
              </Typography.Text>

              <Typography.Text
                type="secondary"
                style={{ fontSize: 12 }}
              >
                {dateFormatter.format(
                  new Date(
                    notification.created_at,
                  ),
                )}
              </Typography.Text>
            </Space>
          </Card>
        );
      })}

      {total > pageSize && (
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger={false}
          onChange={onPageChange}
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        />
      )}
    </Space>
  );
}