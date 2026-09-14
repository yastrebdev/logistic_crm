from collections.abc import Sequence
from datetime import date

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.enums.organization import PositionCategory
from app.exceptions.base import (
    ConflictError,
    NotFoundError,
)
from app.models import AdaptationPolicy
from app.schemas.adaptation import (
    AdaptationPolicyCreate,
    AdaptationPolicyUpdate,
)


def get_adaptation_policies(
    db: Session,
    position_category: PositionCategory | None = None,
) -> Sequence[AdaptationPolicy]:
    query = select(AdaptationPolicy)

    if position_category is not None:
        query = query.where(
            AdaptationPolicy.position_category
            == position_category
        )

    query = query.order_by(
        AdaptationPolicy.position_category,
        AdaptationPolicy.effective_from.desc(),
    )

    return db.scalars(query).all()


def get_adaptation_policy(
    db: Session,
    policy_id: int,
) -> AdaptationPolicy:
    policy = db.get(
        AdaptationPolicy,
        policy_id,
    )

    if policy is None:
        raise NotFoundError(
            "Adaptation policy not found"
        )

    return policy


def get_applicable_adaptation_policy(
    db: Session,
    position_category: PositionCategory,
    reference_date: date,
) -> AdaptationPolicy:
    policies = db.scalars(
        select(AdaptationPolicy)
        .where(
            AdaptationPolicy.position_category
            == position_category,
            AdaptationPolicy.effective_from
            <= reference_date,
            or_(
                AdaptationPolicy.effective_to.is_(None),
                AdaptationPolicy.effective_to
                >= reference_date,
            ),
        )
        .order_by(
            AdaptationPolicy.effective_from.desc()
        )
    ).all()

    if not policies:
        raise NotFoundError(
            "No adaptation policy is configured "
            "for this position category and date"
        )

    if len(policies) > 1:
        raise ConflictError(
            "Multiple adaptation policies match "
            "this position category and date"
        )

    return policies[0]


def has_overlapping_policy(
    db: Session,
    position_category: PositionCategory,
    effective_from: date,
    effective_to: date | None,
    excluded_policy_id: int | None = None,
) -> bool:
    query = select(AdaptationPolicy.id).where(
        AdaptationPolicy.position_category
        == position_category,
        or_(
            AdaptationPolicy.effective_to.is_(None),
            AdaptationPolicy.effective_to
            >= effective_from,
        ),
    )

    if effective_to is not None:
        query = query.where(
            AdaptationPolicy.effective_from
            <= effective_to
        )

    if excluded_policy_id is not None:
        query = query.where(
            AdaptationPolicy.id
            != excluded_policy_id
        )

    return db.scalar(query) is not None


def create_adaptation_policy(
    db: Session,
    data: AdaptationPolicyCreate,
) -> AdaptationPolicy:
    if has_overlapping_policy(
        db=db,
        position_category=data.position_category,
        effective_from=data.effective_from,
        effective_to=data.effective_to,
    ):
        raise ConflictError(
            "Adaptation policy period overlaps "
            "an existing policy for this category"
        )

    policy = AdaptationPolicy(
        **data.model_dump()
    )

    db.add(policy)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Adaptation policy data conflicts "
            "with an existing record"
        ) from None

    db.refresh(policy)

    return policy


def update_adaptation_policy(
    db: Session,
    policy_id: int,
    data: AdaptationPolicyUpdate,
) -> AdaptationPolicy:
    policy = db.get(
        AdaptationPolicy,
        policy_id,
    )

    if policy is None:
        raise NotFoundError(
            "Adaptation policy not found"
        )

    update_data = data.model_dump(
        exclude_unset=True,
    )

    if not update_data:
        return policy

    target_category = update_data.get(
        "position_category",
        policy.position_category,
    )
    target_effective_from = update_data.get(
        "effective_from",
        policy.effective_from,
    )
    target_effective_to = update_data.get(
        "effective_to",
        policy.effective_to,
    )

    if (
        target_effective_to is not None
        and target_effective_to
        < target_effective_from
    ):
        raise ConflictError(
            "Policy end date cannot be earlier "
            "than start date"
        )

    if has_overlapping_policy(
        db=db,
        position_category=target_category,
        effective_from=target_effective_from,
        effective_to=target_effective_to,
        excluded_policy_id=policy.id,
    ):
        raise ConflictError(
            "Adaptation policy period overlaps "
            "an existing policy for this category"
        )

    for field, value in update_data.items():
        setattr(policy, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Adaptation policy data conflicts "
            "with an existing record"
        ) from None

    db.refresh(policy)

    return policy


def delete_adaptation_policy(
    db: Session,
    policy_id: int,
) -> None:
    policy = db.get(
        AdaptationPolicy,
        policy_id,
    )

    if policy is None:
        raise NotFoundError(
            "Adaptation policy not found"
        )

    db.delete(policy)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Adaptation policy cannot be deleted "
            "because it is used by adaptation processes"
        ) from None