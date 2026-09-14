from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import (
    Session,
    selectinload,
)

from app.exceptions.base import (
    ConflictError,
    NotFoundError,
)
from app.models import (
    DistributionCenter,
    DistributionCenterDivision,
    Division,
    User,
)
from app.schemas.organization import (
    DistributionCenterCreate,
    DistributionCenterDivisionCreate,
    DistributionCenterStructureResponse,
    DistributionCenterUpdate,
    DivisionGroupStructureResponse,
    DivisionUnitStructureResponse,
    PositionResponse,
)
from app.services.center_access_service import (
    ensure_can_manage_center,
)


def get_centers(
    db: Session,
) -> Sequence[DistributionCenter]:
    return db.scalars(
        select(DistributionCenter)
        .order_by(DistributionCenter.name)
    ).all()


def get_center(
    db: Session,
    center_id: int,
) -> DistributionCenter:
    center = db.get(
        DistributionCenter,
        center_id,
    )

    if center is None:
        raise NotFoundError(
            "Distribution center not found"
        )

    return center


def create_center(
    db: Session,
    data: DistributionCenterCreate,
) -> DistributionCenter:
    existing_center = db.scalar(
        select(DistributionCenter)
        .where(
            DistributionCenter.code == data.code
        )
    )

    if existing_center is not None:
        raise ConflictError(
            "Center with this code already exists"
        )

    center = DistributionCenter(
        code=data.code,
        name=data.name,
        city=data.city,
    )

    db.add(center)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Center with this code already exists"
        ) from None

    db.refresh(center)

    return center


def update_center(
    db: Session,
    center_id: int,
    data: DistributionCenterUpdate,
) -> DistributionCenter:
    center = db.get(
        DistributionCenter,
        center_id,
    )

    if center is None:
        raise NotFoundError(
            "Distribution center not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    target_code = update_data.get(
        "code",
        center.code,
    )

    existing_center = db.scalar(
        select(DistributionCenter)
        .where(
            DistributionCenter.code == target_code,
            DistributionCenter.id != center_id,
        )
    )

    if existing_center is not None:
        raise ConflictError(
            "Center with this code already exists"
        )

    for field, value in update_data.items():
        setattr(center, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Distribution center data conflicts "
            "with an existing record"
        ) from None

    db.refresh(center)

    return center


def delete_center(
    db: Session,
    center_id: int,
) -> None:
    center = db.get(
        DistributionCenter,
        center_id,
    )

    if center is None:
        raise NotFoundError(
            "Distribution center not found"
        )

    db.delete(center)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Distribution center cannot be deleted "
            "while its divisions are assigned to employees"
        ) from None


def get_center_divisions(
    db: Session,
    center_id: int,
) -> Sequence[DistributionCenterDivision]:
    center = db.get(
        DistributionCenter,
        center_id,
    )

    if center is None:
        raise NotFoundError(
            "Distribution center not found"
        )

    return db.scalars(
        select(DistributionCenterDivision)
        .where(
            DistributionCenterDivision.distribution_center_id
            == center_id
        )
        .options(
            selectinload(
                DistributionCenterDivision.division
            ).selectinload(
                Division.division_group
            )
        )
        .order_by(
            DistributionCenterDivision.name
        )
    ).all()


def create_center_division(
    db: Session,
    center_id: int,
    data: DistributionCenterDivisionCreate,
    actor: User,
) -> DistributionCenterDivision:
    ensure_can_manage_center(
        db=db,
        user=actor,
        center_id=center_id,
    )

    division = db.get(
        Division,
        data.division_id,
    )

    if division is None:
        raise NotFoundError(
            "Division not found"
        )

    existing_unit = db.scalar(
        select(DistributionCenterDivision)
        .where(
            DistributionCenterDivision
            .distribution_center_id
            == center_id,
            DistributionCenterDivision.name
            == data.name,
        )
    )

    if existing_unit is not None:
        raise ConflictError(
            "A division with this name already exists "
            "in this distribution center"
        )

    center_division = (
        DistributionCenterDivision(
            distribution_center_id=(
                center_id
            ),
            division_id=data.division_id,
            name=data.name,
        )
    )

    db.add(center_division)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Distribution center division data conflicts "
            "with an existing record"
        ) from None

    db.refresh(center_division)

    return center_division


def delete_center_division(
    db: Session,
    center_id: int,
    center_division_id: int,
    actor: User,
) -> None:
    ensure_can_manage_center(
        db=db,
        user=actor,
        center_id=center_id,
    )

    center_division = db.scalar(
        select(DistributionCenterDivision)
        .where(
            DistributionCenterDivision.id
            == center_division_id,
            DistributionCenterDivision
            .distribution_center_id
            == center_id,
        )
    )

    if center_division is None:
        raise NotFoundError(
            "Distribution center division not found"
        )

    db.delete(center_division)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Distribution center division cannot be "
            "removed while employees are assigned to it"
        ) from None


def get_center_structure(
    db: Session,
    center_id: int,
) -> DistributionCenterStructureResponse:
    center = db.get(
        DistributionCenter,
        center_id,
    )

    if center is None:
        raise NotFoundError(
            "Distribution center not found"
        )

    center_divisions = db.scalars(
        select(DistributionCenterDivision)
        .where(
            DistributionCenterDivision.distribution_center_id
            == center_id
        )
        .options(
            selectinload(
                DistributionCenterDivision.division
            ).selectinload(
                Division.division_group
            ),
            selectinload(
                DistributionCenterDivision.division
            ).selectinload(
                Division.positions
            ),
        )
        .order_by(
            DistributionCenterDivision.name
        )
    ).all()

    groups: dict[int, DivisionGroupStructureResponse] = {}

    for center_division in center_divisions:
        division = center_division.division
        group = division.division_group

        if group.id not in groups:
            groups[group.id] = DivisionGroupStructureResponse(
                id=group.id,
                code=group.code,
                name=group.name,
                abbreviation=group.abbreviation,
                divisions=[],
            )

        positions = [
            PositionResponse.model_validate(position)
            for position in sorted(
                division.positions,
                key=lambda item: item.name,
            )
        ]

        groups[group.id].divisions.append(
            DivisionUnitStructureResponse(
                id=center_division.id,
                name=center_division.name,
                division_id=division.id,
                positions=positions,
            )
        )

    sorted_groups = sorted(
        groups.values(),
        key=lambda group: group.name,
    )

    return DistributionCenterStructureResponse(
        id=center.id,
        code=center.code,
        name=center.name,
        city=center.city,
        groups=sorted_groups,
    )