from enum import Enum


class NotificationType(str, Enum):
    SYSTEM = "system"
    ADMINISTRATIVE = "administrative"
    ORGANIZATION_UPDATED = "organization_updated"
    DEADLINE = "deadline"
    TASK_ASSIGNED = "task_assigned"
    TASK_UPDATED = "task_updated"
    SUBORDINATE_ACTION = "subordinate_action"