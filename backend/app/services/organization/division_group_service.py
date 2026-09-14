from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions.base import (
    ConflictError,
    NotFoundError,
)
from app.models import DivisionGroup
from app.schemas.organization import (
    DivisionGroupCreate,
    DivisionGroupUpdate,
)


def get_groups(
    db: Session,
) -> Sequence[DivisionGroup]:
    return db.scalars(
        select(DivisionGroup)
        .order_by(DivisionGroup.name)
    ).all()


def get_group(
    db: Session,
    group_id: int,
) -> DivisionGroup:
    group = db.get(
        DivisionGroup,
        group_id,
    )

    if group is None:
        raise NotFoundError(
            "Division group not found"
        )

    return group


def create_group(
    db: Session,
    data: DivisionGroupCreate,
) -> DivisionGroup:
    existing_group = db.scalar(
        select(DivisionGroup)
        .where(
            DivisionGroup.code == data.code
        )
    )

    if existing_group is not None:
        raise ConflictError(
            "Division group with this code already exists"
        )

    group = DivisionGroup(
        code=data.code,
        name=data.name,
        abbreviation=data.abbreviation,
    )

    db.add(group)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Division group data conflicts "
            "with an existing record"
        ) from None

    db.refresh(group)

    return group


def update_group(
    db: Session,
    group_id: int,
    data: DivisionGroupUpdate,
) -> DivisionGroup:
    group = db.get(
        DivisionGroup,
        group_id,
    )

    if group is None:
        raise NotFoundError(
            "Division group not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    target_code = update_data.get(
        "code",
        group.code,
    )

    existing_group = db.scalar(
        select(DivisionGroup)
        .where(
            DivisionGroup.code == target_code,
            DivisionGroup.id != group_id,
        )
    )

    if existing_group is not None:
        raise ConflictError(
            "Division group with this code already exists"
        )

    for field, value in update_data.items():
        setattr(group, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Division group data conflicts "
            "with an existing record"
        ) from None

    db.refresh(group)

    return group


def delete_group(
    db: Session,
    group_id: int,
) -> None:
    group = db.get(
        DivisionGroup,
        group_id,
    )

    if group is None:
        raise NotFoundError(
            "Division group not found"
        )

    db.delete(group)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Division group cannot be deleted "
            "while it contains divisions"
        ) from None