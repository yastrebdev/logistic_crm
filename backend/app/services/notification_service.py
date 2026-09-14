from collections.abc import Iterable, Sequence
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    func,
    or_,
    select,
    update,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import (
    Session,
    selectinload,
)

from app.enums.notification import NotificationType
from app.exceptions.base import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)
from app.models import DistributionCenter
from app.models.notification import (
    Notification,
    NotificationRecipient,
)
from app.models.user import (
    User,
    UserDistributionCenter,
)
from app.schemas.notification import NotificationCreate


def _get_active_user_ids(
    db: Session,
    user_ids: Iterable[int],
) -> set[int]:
    unique_user_ids = set(user_ids)

    if not unique_user_ids:
        return set()

    return set(
        db.scalars(
            select(User.id)
            .where(
                User.id.in_(unique_user_ids),
                User.is_active.is_(True),
            )
        ).all()
    )


def add_notification(
    db: Session,
    recipient_user_ids: Iterable[int],
    notification_type: NotificationType,
    title: str,
    message: str,
    created_by_user_id: int | None = None,
    source_type: str | None = None,
    source_id: int | None = None,
    event_key: str | None = None,
    payload: dict[str, Any] | None = None,
    expires_at: datetime | None = None,
) -> Notification:
    active_user_ids = _get_active_user_ids(
        db=db,
        user_ids=recipient_user_ids,
    )

    if not active_user_ids:
        raise BusinessRuleError(
            "Notification has no active recipients"
        )

    notification = Notification(
        notification_type=notification_type,
        title=title,
        message=message,
        created_by_user_id=created_by_user_id,
        source_type=source_type,
        source_id=source_id,
        event_key=event_key,
        payload=payload,
        expires_at=expires_at,
    )

    notification.recipients = [
        NotificationRecipient(
            user_id=user_id,
        )
        for user_id in sorted(active_user_ids)
    ]

    db.add(notification)

    return notification


def create_notification(
    db: Session,
    recipient_user_ids: Iterable[int],
    notification_type: NotificationType,
    title: str,
    message: str,
    created_by_user_id: int | None = None,
    source_type: str | None = None,
    source_id: int | None = None,
    event_key: str | None = None,
    payload: dict[str, Any] | None = None,
    expires_at: datetime | None = None,
) -> Notification:
    notification = add_notification(
        db=db,
        recipient_user_ids=recipient_user_ids,
        notification_type=notification_type,
        title=title,
        message=message,
        created_by_user_id=created_by_user_id,
        source_type=source_type,
        source_id=source_id,
        event_key=event_key,
        payload=payload,
        expires_at=expires_at,
    )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        if event_key is not None:
            raise ConflictError(
                "Notification for this event "
                "already exists"
            ) from None

        raise ConflictError(
            "Notification data conflicts "
            "with an existing record"
        ) from None

    db.refresh(notification)

    return notification


def create_administrative_notification(
    db: Session,
    data: NotificationCreate,
    actor: User,
) -> Notification:
    recipient_user_ids: set[int] = set(
        data.user_ids
    )

    if data.send_to_all:
        recipient_user_ids.update(
            db.scalars(
                select(User.id)
                .where(
                    User.is_active.is_(True)
                )
            ).all()
        )

    if data.distribution_center_ids:
        existing_center_ids = set(
            db.scalars(
                select(DistributionCenter.id)
                .where(
                    DistributionCenter.id.in_(
                        data.distribution_center_ids
                    )
                )
            ).all()
        )

        missing_center_ids = (
            set(data.distribution_center_ids)
            - existing_center_ids
        )

        if missing_center_ids:
            raise NotFoundError(
                "Distribution centers not found",
                details={
                    "distribution_center_ids": sorted(
                        missing_center_ids
                    )
                },
            )

        center_user_ids = db.scalars(
            select(UserDistributionCenter.user_id)
            .join(
                User,
                User.id
                == UserDistributionCenter.user_id,
            )
            .where(
                UserDistributionCenter
                .distribution_center_id
                .in_(
                    data.distribution_center_ids
                ),
                User.is_active.is_(True),
            )
            .distinct()
        ).all()

        recipient_user_ids.update(
            center_user_ids
        )

    if data.user_ids:
        existing_user_ids = set(
            db.scalars(
                select(User.id)
                .where(
                    User.id.in_(data.user_ids)
                )
            ).all()
        )

        missing_user_ids = (
            set(data.user_ids)
            - existing_user_ids
        )

        if missing_user_ids:
            raise NotFoundError(
                "Users not found",
                details={
                    "user_ids": sorted(
                        missing_user_ids
                    )
                },
            )

    return create_notification(
        db=db,
        recipient_user_ids=recipient_user_ids,
        notification_type=(
            NotificationType.ADMINISTRATIVE
        ),
        title=data.title,
        message=data.message,
        created_by_user_id=actor.id,
        payload=data.payload,
        expires_at=data.expires_at,
    )


def get_user_notifications(
    db: Session,
    user_id: int,
    page: int,
    page_size: int,
    unread_only: bool,
) -> tuple[
    int,
    int,
    Sequence[NotificationRecipient],
]:
    now = datetime.now(timezone.utc)

    filters = [
        NotificationRecipient.user_id == user_id,
        or_(
            Notification.expires_at.is_(None),
            Notification.expires_at > now,
        ),
    ]

    if unread_only:
        filters.append(
            NotificationRecipient.read_at.is_(None)
        )

    total = db.scalar(
        select(
            func.count(NotificationRecipient.id)
        )
        .join(
            Notification,
            Notification.id
            == NotificationRecipient.notification_id,
        )
        .where(*filters)
    ) or 0

    unread_count = db.scalar(
        select(
            func.count(NotificationRecipient.id)
        )
        .join(
            Notification,
            Notification.id
            == NotificationRecipient.notification_id,
        )
        .where(
            NotificationRecipient.user_id == user_id,
            NotificationRecipient.read_at.is_(None),
            or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > now,
            ),
        )
    ) or 0

    offset = (page - 1) * page_size

    recipients = db.scalars(
        select(NotificationRecipient)
        .join(
            Notification,
            Notification.id
            == NotificationRecipient.notification_id,
        )
        .where(*filters)
        .options(
            selectinload(
                NotificationRecipient.notification
            )
        )
        .order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )
        .offset(offset)
        .limit(page_size)
    ).all()

    return total, unread_count, recipients


def get_unread_count(
    db: Session,
    user_id: int,
) -> int:
    now = datetime.now(timezone.utc)

    return db.scalar(
        select(
            func.count(NotificationRecipient.id)
        )
        .join(
            Notification,
            Notification.id
            == NotificationRecipient.notification_id,
        )
        .where(
            NotificationRecipient.user_id == user_id,
            NotificationRecipient.read_at.is_(None),
            or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > now,
            ),
        )
    ) or 0


def mark_notification_as_read(
    db: Session,
    user_id: int,
    notification_id: int,
) -> NotificationRecipient:
    recipient = db.scalar(
        select(NotificationRecipient)
        .where(
            NotificationRecipient.user_id == user_id,
            NotificationRecipient.notification_id
            == notification_id,
        )
        .options(
            selectinload(
                NotificationRecipient.notification
            )
        )
    )

    if recipient is None:
        raise NotFoundError(
            "Notification not found"
        )

    if recipient.read_at is None:
        recipient.read_at = datetime.now(
            timezone.utc
        )

        db.commit()
        db.refresh(recipient)

    return recipient


def mark_all_notifications_as_read(
    db: Session,
    user_id: int,
) -> None:
    db.execute(
        update(NotificationRecipient)
        .where(
            NotificationRecipient.user_id == user_id,
            NotificationRecipient.read_at.is_(None),
        )
        .values(
            read_at=datetime.now(timezone.utc)
        )
    )

    db.commit()