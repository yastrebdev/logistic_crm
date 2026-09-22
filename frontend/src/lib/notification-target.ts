import type { AppNotification } from "./api/notifications";

export function getNotificationTarget(
  notification: AppNotification,
): string | null {
  switch (notification.source_type) {
    case "distribution_center":
    case "distribution_center_division":
    case "division_group":
    case "division":
    case "position":
      return "/admin/organization";

    default:
      return null;
  }
}