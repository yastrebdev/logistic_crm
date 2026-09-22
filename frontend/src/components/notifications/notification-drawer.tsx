"use client";

import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  CheckOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Drawer,
  Space,
  Switch,
  Tabs,
  Typography,
  App,
} from "antd";
import { useRouter } from "next/navigation";

import { NotificationCreateForm } from "./notification-create-form";
import { NotificationList } from "./notification-list";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
} from "@/lib/api/notifications";
import { getNotificationTarget } from "@/lib/notification-target";

type NotificationDrawerProps = {
  open: boolean;
  canCreate: boolean;
  onClose: () => void;
};

export function NotificationDrawer({
  open,
  canCreate,
  onClose,
}: NotificationDrawerProps) {
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState("notifications");

  const pageSize = 20;

  const { message } = App.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: [
      "notifications",
      "list",
      page,
      pageSize,
      unreadOnly,
    ],
    queryFn: () =>
      getNotifications({
        page,
        page_size: pageSize,
        unread_only: unreadOnly,
      }),
    enabled: open,
  });

  const invalidateNotifications = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["notifications"],
    });
  };

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,

    onSuccess: invalidateNotifications,

    onError: (error) => {
      message.error(error.message);
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,

    onSuccess: async () => {
      message.success(
        "Все уведомления отмечены прочитанными",
      );

      setPage(1);
      await invalidateNotifications();
    },

    onError: (error) => {
      message.error(error.message);
    },
  });

  const openNotification = async (
    notification: AppNotification,
  ) => {
    if (
      notification.read_at === null &&
      !(
        markReadMutation.isPending &&
        markReadMutation.variables ===
          notification.id
      )
    ) {
      try {
        await markReadMutation.mutateAsync(
          notification.id,
        );
      } catch {
        return;
      }
    }

    const target =
      getNotificationTarget(notification);

    if (target) {
      onClose();
      router.push(target);
    }
  };

  const notificationsTab = (
    <Space
      orientation="vertical"
      size="middle"
      style={{ width: "100%" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Space>
          <Switch
            checked={unreadOnly}
            onChange={(checked) => {
              setUnreadOnly(checked);
              setPage(1);
            }}
          />

          <Typography.Text>
            Только непрочитанные
          </Typography.Text>
        </Space>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={
              notificationsQuery.isFetching
            }
            onClick={() =>
              notificationsQuery.refetch()
            }
          />

          <Button
            icon={<CheckOutlined />}
            loading={markAllMutation.isPending}
            disabled={
              (notificationsQuery.data
                ?.unread_count ?? 0) === 0
            }
            onClick={() =>
              markAllMutation.mutate()
            }
          >
            Прочитать все
          </Button>
        </Space>
      </div>

      <NotificationList
        notifications={
          notificationsQuery.data?.items ?? []
        }
        loading={notificationsQuery.isLoading}
        error={
          notificationsQuery.error ?? null
        }
        page={
          notificationsQuery.data?.page ?? page
        }
        pageSize={
          notificationsQuery.data?.page_size ??
          pageSize
        }
        total={
          notificationsQuery.data?.total ?? 0
        }
        onPageChange={setPage}
        onOpen={openNotification}
      />
    </Space>
  );

  return (
    <Drawer
      title="Уведомления"
      open={open}
      size="large"
      onClose={onClose}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "notifications",
            label: "Мои уведомления",
            children: notificationsTab,
          },
          ...(canCreate
            ? [
                {
                  key: "create",
                  label: "Отправить",
                  children: (
                    <NotificationCreateForm
                      onCreated={() => {
                        setActiveTab(
                          "notifications",
                        );
                        setPage(1);
                      }}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />
    </Drawer>
  );
}