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
    Position,
)
from app.schemas.organization import (
    PositionCreate,
    PositionUpdate,
)


def get_positions(
    db: Session,
    division_id: int | None = None,
) -> Sequence[Position]:
    query = select(Position)

    if division_id is not None:
        query = query.where(
            Position.division_id == division_id
        )

    query = query.order_by(
        Position.name
    )

    return db.scalars(query).all()


def get_position(
    db: Session,
    position_id: int,
) -> Position:
    position = db.get(
        Position,
        position_id,
    )

    if position is None:
        raise NotFoundError(
            "Position not found"
        )

    return position


def create_position(
    db: Session,
    data: PositionCreate,
) -> Position:
    division = db.get(
        Division,
        data.division_id,
    )

    if division is None:
        raise NotFoundError(
            "Division not found"
        )

    existing_position = db.scalar(
        select(Position)
        .where(
            Position.division_id == data.division_id,
            Position.name == data.name,
        )
    )

    if existing_position is not None:
        raise ConflictError(
            "Position with this name already exists "
            "in this division"
        )

    position = Position(
        division_id=data.division_id,
        name=data.name,
        category=data.category,
    )

    db.add(position)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Position data conflicts "
            "with an existing record"
        ) from None

    db.refresh(position)

    return position


def update_position(
    db: Session,
    position_id: int,
    data: PositionUpdate,
) -> Position:
    position = db.get(
        Position,
        position_id,
    )

    if position is None:
        raise NotFoundError(
            "Position not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    target_division_id = update_data.get(
        "division_id",
        position.division_id,
    )

    target_name = update_data.get(
        "name",
        position.name,
    )

    if "division_id" in update_data:
        division = db.get(
            Division,
            target_division_id,
        )

        if division is None:
            raise NotFoundError(
                "Division not found"
            )

    existing_position = db.scalar(
        select(Position)
        .where(
            Position.division_id == target_division_id,
            Position.name == target_name,
            Position.id != position_id,
        )
    )

    if existing_position is not None:
        raise ConflictError(
            "Position with this name already exists "
            "in this division"
        )

    for field, value in update_data.items():
        setattr(position, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Position data conflicts "
            "with an existing record"
        ) from None

    db.refresh(position)

    return position


def delete_position(
    db: Session,
    position_id: int,
) -> None:
    position = db.get(
        Position,
        position_id,
    )

    if position is None:
        raise NotFoundError(
            "Position not found"
        )

    db.delete(position)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Position cannot be deleted while it is "
            "assigned to employees"
        ) from None