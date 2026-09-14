from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions.base import (
    ConflictError,
    NotFoundError,
)
from app.models import (
    Division,
    DivisionGroup,
)
from app.schemas.organization import (
    DivisionCreate,
    DivisionUpdate,
)
from app.enums.notification import NotificationType
from app.models.user import User
from app.services import notification_service


def get_divisions(
    db: Session,
    division_group_id: int | None = None,
) -> Sequence[Division]:
    query = select(Division)

    if division_group_id is not None:
        query = query.where(
            Division.division_group_id
            == division_group_id
        )

    query = query.order_by(
        Division.name
    )

    return db.scalars(query).all()


def get_division(
    db: Session,
    division_id: int,
) -> Division:
    division = db.get(
        Division,
        division_id,
    )

    if division is None:
        raise NotFoundError(
            "Division not found"
        )

    return division


def create_division(
    db: Session,
    data: DivisionCreate,
    actor: User,
) -> Division:
    group = db.get(
        DivisionGroup,
        data.division_group_id,
    )

    if group is None:
        raise NotFoundError(
            "Division group not found"
        )

    existing_division = db.scalar(
        select(Division)
        .where(
            Division.division_group_id
            == data.division_group_id,
            Division.name == data.name,
        )
    )

    if existing_division is not None:
        raise ConflictError(
            "Division with this name already exists "
            "in this division group"
        )

    division = Division(
        division_group_id=data.division_group_id,
        name=data.name,
    )

    db.add(division)

    try:
        # Получаем ID подразделения до общего commit.
        db.flush()

        active_user_ids = db.scalars(
            select(User.id)
            .where(
                User.is_active.is_(True)
            )
        ).all()

        notification_service.add_notification(
            db=db,
            recipient_user_ids=active_user_ids,
            notification_type=(
                NotificationType.ORGANIZATION_UPDATED
            ),
            title="Создано подразделение",
            message=(
                f"Пользователь {actor.email} создал "
                f"подразделение «{division.name}»"
            ),
            created_by_user_id=actor.id,
            source_type="division",
            source_id=division.id,
            event_key=(
                f"division:{division.id}:created"
            ),
            payload={
                "division_id": division.id,
                "division_group_id": (
                    division.division_group_id
                ),
            },
        )

        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Division data conflicts "
            "with an existing record"
        ) from None

    db.refresh(division)

    return division


def update_division(
    db: Session,
    division_id: int,
    data: DivisionUpdate,
) -> Division:
    division = db.get(
        Division,
        division_id,
    )

    if division is None:
        raise NotFoundError(
            "Division not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    target_group_id = update_data.get(
        "division_group_id",
        division.division_group_id,
    )

    target_name = update_data.get(
        "name",
        division.name,
    )

    if "division_group_id" in update_data:
        group = db.get(
            DivisionGroup,
            target_group_id,
        )

        if group is None:
            raise NotFoundError(
                "Division group not found"
            )

    existing_division = db.scalar(
        select(Division)
        .where(
            Division.division_group_id
            == target_group_id,
            Division.name == target_name,
            Division.id != division_id,
        )
    )

    if existing_division is not None:
        raise ConflictError(
            "Division with this name already exists "
            "in this division group"
        )

    for field, value in update_data.items():
        setattr(division, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Division data conflicts "
            "with an existing record"
        ) from None

    db.refresh(division)

    return division


def delete_division(
    db: Session,
    division_id: int,
) -> None:
    division = db.get(
        Division,
        division_id,
    )

    if division is None:
        raise NotFoundError(
            "Division not found"
        )

    db.delete(division)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Division cannot be deleted while it is "
            "used by positions or distribution centers"
        ) from None