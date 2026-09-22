import { apiClient } from "./client";

export type NotificationType =
  | "system"
  | "administrative"
  | "organization_updated"
  | "deadline"
  | "task_assigned"
  | "task_updated"
  | "subordinate_action";

export type AppNotification = {
  id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  source_type: string | null;
  source_id: number | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  expires_at: string | null;
  read_at: string | null;
};

export type NotificationListResponse = {
  items: AppNotification[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
};

export type NotificationUnreadCountResponse = {
  unread_count: number;
};

export type GetNotificationsParams = {
  page?: number;
  page_size?: number;
  unread_only?: boolean;
};

export type NotificationCreate = {
  title: string;
  message: string;
  send_to_all: boolean;
  user_ids: number[];
  distribution_center_ids: number[];
  payload?: Record<string, unknown> | null;
  expires_at?: string | null;
};

export type NotificationCreatedResponse = {
  id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  recipient_count: number;
  created_at: string;
};

export function getNotifications({
  page = 1,
  page_size = 20,
  unread_only = false,
}: GetNotificationsParams = {}): Promise<NotificationListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(page_size),
    unread_only: String(unread_only),
  });

  return apiClient<NotificationListResponse>(
    `/notifications?${params.toString()}`,
    {
      auth: true,
    },
  );
}

export function getUnreadNotificationCount(): Promise<
  NotificationUnreadCountResponse
> {
  return apiClient<NotificationUnreadCountResponse>(
    "/notifications/unread-count",
    {
      auth: true,
    },
  );
}

export function markNotificationAsRead(
  notificationId: number,
): Promise<AppNotification> {
  return apiClient<AppNotification>(
    `/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      auth: true,
    },
  );
}

export function markAllNotificationsAsRead(): Promise<void> {
  return apiClient<void>(
    "/notifications/read-all",
    {
      method: "POST",
      auth: true,
    },
  );
}

export function createNotification(
  data: NotificationCreate,
): Promise<NotificationCreatedResponse> {
  return apiClient<NotificationCreatedResponse>(
    "/notifications",
    {
      method: "POST",
      auth: true,
      body: JSON.stringify(data),
    },
  );
}