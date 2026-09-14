from datetime import datetime
from typing import Any

from pydantic import (
    BaseModel,
    Field,
    model_validator,
)

from app.enums.notification import NotificationType


class NotificationCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )

    message: str = Field(
        min_length=1,
    )

    send_to_all: bool = False

    user_ids: list[int] = Field(
        default_factory=list,
    )

    distribution_center_ids: list[int] = Field(
        default_factory=list,
    )

    payload: dict[str, Any] | None = None

    expires_at: datetime | None = None

    @model_validator(mode="after")
    def validate_audience(self):
        if (
            not self.send_to_all
            and not self.user_ids
            and not self.distribution_center_ids
        ):
            raise ValueError(
                "At least one notification audience "
                "must be selected"
            )

        self.user_ids = list(
            dict.fromkeys(self.user_ids)
        )

        self.distribution_center_ids = list(
            dict.fromkeys(
                self.distribution_center_ids
            )
        )

        return self


class NotificationResponse(BaseModel):
    id: int
    notification_type: NotificationType
    title: str
    message: str
    source_type: str | None
    source_id: int | None
    payload: dict[str, Any] | None
    created_at: datetime
    expires_at: datetime | None
    read_at: datetime | None


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    unread_count: int
    page: int
    page_size: int


class NotificationUnreadCountResponse(BaseModel):
    unread_count: int


class NotificationCreatedResponse(BaseModel):
    id: int
    notification_type: NotificationType
    title: str
    message: str
    recipient_count: int
    created_at: datetime