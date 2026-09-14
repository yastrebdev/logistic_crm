from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions.base import (
    ForbiddenError,
    NotFoundError,
)
from app.models.organization import (
    DistributionCenter,
)
from app.models.user import (
    User,
    UserDistributionCenter,
)


MANAGE_ALL_CENTERS_PERMISSION = (
    "organization.manage_all_centers"
)


def user_has_permission(
    user: User,
    permission_name: str,
) -> bool:
    return any(
        permission.name == permission_name
        for permission in user.role.permissions
    )


def can_manage_all_centers(
    user: User,
) -> bool:
    return user_has_permission(
        user=user,
        permission_name=(
            MANAGE_ALL_CENTERS_PERMISSION
        ),
    )


def get_user_center_ids(
    db: Session,
    user_id: int,
) -> set[int]:
    center_ids = db.scalars(
        select(
            UserDistributionCenter
            .distribution_center_id
        )
        .where(
            UserDistributionCenter.user_id
            == user_id
        )
    ).all()

    return set(center_ids)


def get_dashboard_center_ids(
    db: Session,
    user: User,
) -> set[int]:
    """
    Возвращает РЦ, которые должны использоваться
    на главной странице по умолчанию.

    Пользователь с глобальным разрешением получает
    данные по всем РЦ. Остальные — только по своим.
    """
    if can_manage_all_centers(user):
        center_ids = db.scalars(
            select(DistributionCenter.id)
        ).all()

        return set(center_ids)

    return get_user_center_ids(
        db=db,
        user_id=user.id,
    )


def ensure_can_manage_center(
    db: Session,
    user: User,
    center_id: int,
) -> None:
    """
    Проверяет право пользователя изменять данные
    конкретного РЦ.

    Функциональное разрешение, например
    organization.update или onboarding.update,
    проверяется отдельно в роуте.
    """
    center_exists = db.scalar(
        select(DistributionCenter.id)
        .where(
            DistributionCenter.id
            == center_id
        )
    )

    if center_exists is None:
        raise NotFoundError(
            "Distribution center not found"
        )

    if can_manage_all_centers(user):
        return

    center_is_assigned = db.scalar(
        select(
            UserDistributionCenter.id
        )
        .where(
            UserDistributionCenter.user_id
            == user.id,
            UserDistributionCenter
            .distribution_center_id
            == center_id,
        )
    )

    if center_is_assigned is None:
        raise ForbiddenError(
            "You cannot manage this "
            "distribution center"
        )