from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.permissions import require_permission
from app.db.database import get_db
from app.models.notification import (
    NotificationRecipient,
)
from app.models.user import User
from app.schemas.notification import (
    NotificationCreate,
    NotificationCreatedResponse,
    NotificationListResponse,
    NotificationResponse,
    NotificationUnreadCountResponse,
)
from app.services import notification_service


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


def _build_notification_response(
    recipient: NotificationRecipient,
) -> NotificationResponse:
    notification = recipient.notification

    return NotificationResponse(
        id=notification.id,
        notification_type=(
            notification.notification_type
        ),
        title=notification.title,
        message=notification.message,
        source_type=notification.source_type,
        source_id=notification.source_id,
        payload=notification.payload,
        created_at=notification.created_at,
        expires_at=notification.expires_at,
        read_at=recipient.read_at,
    )


@router.get(
    "",
    response_model=NotificationListResponse,
)
def get_notifications(
    unread_only: bool = Query(
        default=False,
    ),
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    current_user: User = Depends(
        require_permission("notifications.read")
    ),
    db: Session = Depends(get_db),
) -> NotificationListResponse:
    total, unread_count, recipients = (
        notification_service.get_user_notifications(
            db=db,
            user_id=current_user.id,
            page=page,
            page_size=page_size,
            unread_only=unread_only,
        )
    )

    return NotificationListResponse(
        items=[
            _build_notification_response(recipient)
            for recipient in recipients
        ],
        total=total,
        unread_count=unread_count,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/unread-count",
    response_model=NotificationUnreadCountResponse,
)
def get_unread_notification_count(
    current_user: User = Depends(
        require_permission("notifications.read")
    ),
    db: Session = Depends(get_db),
) -> NotificationUnreadCountResponse:
    unread_count = (
        notification_service.get_unread_count(
            db=db,
            user_id=current_user.id,
        )
    )

    return NotificationUnreadCountResponse(
        unread_count=unread_count,
    )


@router.post(
    "",
    response_model=NotificationCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_notification(
    data: NotificationCreate,
    current_user: User = Depends(
        require_permission("notifications.create")
    ),
    db: Session = Depends(get_db),
) -> NotificationCreatedResponse:
    notification = (
        notification_service
        .create_administrative_notification(
            db=db,
            data=data,
            actor=current_user,
        )
    )

    return NotificationCreatedResponse(
        id=notification.id,
        notification_type=(
            notification.notification_type
        ),
        title=notification.title,
        message=notification.message,
        recipient_count=len(
            notification.recipients
        ),
        created_at=notification.created_at,
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(
        require_permission("notifications.read")
    ),
    db: Session = Depends(get_db),
) -> NotificationResponse:
    recipient = (
        notification_service.mark_notification_as_read(
            db=db,
            user_id=current_user.id,
            notification_id=notification_id,
        )
    )

    return _build_notification_response(
        recipient
    )


@router.post(
    "/read-all",
    status_code=status.HTTP_204_NO_CONTENT,
)
def mark_all_notifications_as_read(
    current_user: User = Depends(
        require_permission("notifications.read")
    ),
    db: Session = Depends(get_db),
) -> None:
    notification_service.mark_all_notifications_as_read(
        db=db,
        user_id=current_user.id,
    )