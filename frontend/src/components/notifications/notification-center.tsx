"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BellOutlined } from "@ant-design/icons";
import {
  Badge,
  Button,
  Tooltip,
} from "antd";

import { NotificationDrawer } from "./notification-drawer";

import { getUnreadNotificationCount } from "@/lib/api/notifications";

type NotificationCenterProps = {
  canRead: boolean;
  canCreate: boolean;
};

export function NotificationCenter({
  canRead,
  canCreate,
}: NotificationCenterProps) {
  const [isDrawerOpen, setIsDrawerOpen] =
    useState(false);

  const unreadCountQuery = useQuery({
    queryKey: [
      "notifications",
      "unread-count",
    ],
    queryFn: getUnreadNotificationCount,
    enabled: canRead,
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
  });

  if (!canRead) {
    return null;
  }

  return (
    <>
      <Tooltip
        title={
          unreadCountQuery.error
            ? "Не удалось загрузить уведомления"
            : "Уведомления"
        }
      >
        <Badge
          count={
            unreadCountQuery.data?.unread_count ??
            0
          }
          overflowCount={99}
          size="small"
        >
          <Button
            type="text"
            icon={<BellOutlined />}
            loading={unreadCountQuery.isLoading}
            aria-label="Открыть уведомления"
            onClick={() =>
              setIsDrawerOpen(true)
            }
          />
        </Badge>
      </Tooltip>

      <NotificationDrawer
        open={isDrawerOpen}
        canCreate={canCreate}
        onClose={() =>
          setIsDrawerOpen(false)
        }
      />
    </>
  );
}