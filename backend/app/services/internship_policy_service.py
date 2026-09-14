from collections.abc import Sequence
from datetime import date

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import (
    Session,
    selectinload,
)

from app.exceptions.base import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)
from app.models import (
    InternshipPolicy,
    MentorPaymentPolicy,
    Position,
)
from app.schemas.internship_policy import (
    InternshipPolicyCreate,
    InternshipPolicyUpdate,
)


def get_internship_policies(
    db: Session,
    position_id: int | None = None,
) -> Sequence[InternshipPolicy]:
    query = (
        select(InternshipPolicy)
        .options(
            selectinload(
                InternshipPolicy
                .mentor_payment_policy
            )
        )
        .order_by(
            InternshipPolicy.position_id,
            InternshipPolicy.effective_from.desc(),
        )
    )

    if position_id is not None:
        query = query.where(
            InternshipPolicy.position_id
            == position_id
        )

    return db.scalars(query).all()


def get_internship_policy(
    db: Session,
    policy_id: int,
) -> InternshipPolicy:
    policy = db.scalar(
        select(InternshipPolicy)
        .options(
            selectinload(
                InternshipPolicy
                .mentor_payment_policy
            )
        )
        .where(
            InternshipPolicy.id == policy_id
        )
    )

    if policy is None:
        raise NotFoundError(
            "Internship policy not found"
        )

    return policy


def get_effective_internship_policy(
    db: Session,
    position_id: int,
    effective_date: date,
) -> InternshipPolicy:
    policy = db.scalar(
        select(InternshipPolicy)
        .options(
            selectinload(
                InternshipPolicy
                .mentor_payment_policy
            )
        )
        .where(
            InternshipPolicy.position_id
            == position_id,
            InternshipPolicy.effective_from
            <= effective_date,
            or_(
                InternshipPolicy.effective_to
                .is_(None),
                InternshipPolicy.effective_to
                >= effective_date,
            ),
        )
        .order_by(
            InternshipPolicy.effective_from.desc()
        )
    )

    if policy is None:
        raise BusinessRuleError(
            "No internship policy is configured "
            "for this position and date"
        )

    return policy


def create_internship_policy(
    db: Session,
    data: InternshipPolicyCreate,
) -> InternshipPolicy:
    position = db.get(
        Position,
        data.position_id,
    )

    if position is None:
        raise NotFoundError(
            "Position not found"
        )

    _ensure_period_does_not_overlap(
        db=db,
        position_id=data.position_id,
        effective_from=data.effective_from,
        effective_to=data.effective_to,
    )

    policy = InternshipPolicy(
        position_id=data.position_id,
        effective_from=data.effective_from,
        effective_to=data.effective_to,
        duration_min_days=(
            data.duration_min_days
        ),
        duration_max_days=(
            data.duration_max_days
        ),
        probation_months=data.probation_months,
    )

    policy.mentor_payment_policy = (
        MentorPaymentPolicy(
            amount=data.mentor_payment_amount,
        )
    )

    db.add(policy)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise ConflictError(
            "Internship policy data conflicts "
            "with an existing record"
        ) from None

    return get_internship_policy(
        db=db,
        policy_id=policy.id,
    )


def update_internship_policy(
    db: Session,
    policy_id: int,
    data: InternshipPolicyUpdate,
) -> InternshipPolicy:
    policy = get_internship_policy(
        db=db,
        policy_id=policy_id,
    )

    update_data = data.model_dump(
        exclude_unset=True,
    )

    target_position_id = update_data.get(
        "position_id",
        policy.position_id,
    )

    target_effective_from = update_data.get(
        "effective_from",
        policy.effective_from,
    )

    target_effective_to = update_data.get(
        "effective_to",
        policy.effective_to,
    )

    target_duration_min = update_data.get(
        "duration_min_days",
        policy.duration_min_days,
    )

    target_duration_max = update_data.get(
        "duration_max_days",
        policy.duration_max_days,
    )

    if (
        target_effective_to is not None
        and target_effective_to
        < target_effective_from
    ):
        raise BusinessRuleError(
            "effective_to cannot be earlier "
            "than effective_from"
        )

    if (
        target_duration_max
        < target_duration_min
    ):
        raise BusinessRuleError(
            "duration_max_days cannot be less "
            "than duration_min_days"
        )

    if "position_id" in update_data:
        position = db.get(
            Position,
            target_position_id,
        )

        if position is None:
            raise NotFoundError(
                "Position not found"
            )

    _ensure_period_does_not_overlap(
        db=db,
        position_id=target_position_id,
        effective_from=(
            target_effective_from
        ),
        effective_to=target_effective_to,
        excluded_policy_id=policy.id,
    )

    payment_amount = update_data.pop(
        "mentor_payment_amount",
        None,
    )

    for field, value in update_data.items():
        setattr(policy, field, value)

    if payment_amount is not None:
        if (
            policy.mentor_payment_policy
            is None
        ):
            policy.mentor_payment_policy = (
                MentorPaymentPolicy(
                    amount=payment_amount,
                )
            )
        else:
            policy.mentor_payment_policy.amount = (
                payment_amount
            )

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise ConflictError(
            "Internship policy data conflicts "
            "with an existing record"
        ) from None

    return get_internship_policy(
        db=db,
        policy_id=policy.id,
    )


def delete_internship_policy(
    db: Session,
    policy_id: int,
) -> None:
    policy = get_internship_policy(
        db=db,
        policy_id=policy_id,
    )

    db.delete(policy)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise ConflictError(
            "Internship policy cannot be deleted "
            "while it is used by an internship "
            "or mentor payment"
        ) from None


def _ensure_period_does_not_overlap(
    db: Session,
    position_id: int,
    effective_from: date,
    effective_to: date | None,
    excluded_policy_id: int | None = None,
) -> None:
    query = select(InternshipPolicy.id).where(
        InternshipPolicy.position_id
        == position_id,
        or_(
            InternshipPolicy.effective_to
            .is_(None),
            InternshipPolicy.effective_to
            >= effective_from,
        ),
    )

    if effective_to is not None:
        query = query.where(
            InternshipPolicy.effective_from
            <= effective_to
        )

    if excluded_policy_id is not None:
        query = query.where(
            InternshipPolicy.id
            != excluded_policy_id
        )

    existing_policy_id = db.scalar(query)

    if existing_policy_id is not None:
        raise ConflictError(
            "Internship policy periods cannot "
            "overlap for the same position"
        )