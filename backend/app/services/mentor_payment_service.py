from collections.abc import Sequence
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.enums.mentor_payment import PaymentStatus
from app.exceptions.base import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)
from app.models import (
    MainInternship,
    MentorPayment,
)
from app.schemas.mentor_payment import (
    MentorPaymentCreate,
    MentorPaymentUpdate,
)


def get_mentor_payments(
    db: Session,
    main_internship_id: int | None = None,
) -> Sequence[MentorPayment]:
    query = select(MentorPayment)

    if main_internship_id is not None:
        query = query.where(
            MentorPayment.main_internship_id
            == main_internship_id
        )

    query = query.order_by(
        MentorPayment.payment_created_at.desc(),
        MentorPayment.id.desc(),
    )

    return db.scalars(query).all()


def get_mentor_payment(
    db: Session,
    payment_id: int,
) -> MentorPayment:
    payment = db.get(
        MentorPayment,
        payment_id,
    )

    if payment is None:
        raise NotFoundError(
            "Mentor payment not found"
        )

    return payment


def validate_payment_data(
    internship_form_completed: bool,
    amount: Decimal | None,
    payment_status: PaymentStatus,
    payment_created_at: date | None,
    paid_at: date | None,
    non_payment_reason,
) -> None:
    if (
        payment_status == PaymentStatus.PAID
        and paid_at is None
    ):
        raise BusinessRuleError(
            "Paid date is required for a paid payment"
        )

    if (
        payment_status == PaymentStatus.PAID
        and amount is None
    ):
        raise BusinessRuleError(
            "Amount is required for a paid payment"
        )

    if (
        paid_at is not None
        and payment_status != PaymentStatus.PAID
    ):
        raise BusinessRuleError(
            "Paid date can only be specified "
            "for a paid payment"
        )

    if (
        payment_status == PaymentStatus.CANCELLED
        and non_payment_reason is None
    ):
        raise BusinessRuleError(
            "Non-payment reason is required "
            "for a cancelled payment"
        )

    if (
        payment_status != PaymentStatus.CANCELLED
        and non_payment_reason is not None
    ):
        raise BusinessRuleError(
            "Non-payment reason can only be specified "
            "for a cancelled payment"
        )

    if (
        payment_created_at is not None
        and paid_at is not None
        and paid_at < payment_created_at
    ):
        raise BusinessRuleError(
            "Paid date cannot be earlier "
            "than payment creation date"
        )

    if (
        payment_status == PaymentStatus.PAID
        and not internship_form_completed
    ):
        raise BusinessRuleError(
            "Payment cannot be marked as paid "
            "until the internship form is completed"
        )


def create_mentor_payment(
    db: Session,
    data: MentorPaymentCreate,
) -> MentorPayment:
    main_internship = db.get(
        MainInternship,
        data.main_internship_id,
    )

    if main_internship is None:
        raise NotFoundError(
            "Main internship not found"
        )

    if main_internship.mentor_id is None:
        raise BusinessRuleError(
            "Mentor payment cannot be created "
            "for an internship without a mentor"
        )

    if (
        main_internship.internship_policy
        is None
    ):
        raise BusinessRuleError(
            "Main internship does not have "
            "an internship policy"
        )

    payment_policy = (
        main_internship
        .internship_policy
        .mentor_payment_policy
    )

    if payment_policy is None:
        raise BusinessRuleError(
            "Mentor payment policy is not configured "
            "for this internship"
        )

    existing_payment = db.scalar(
        select(MentorPayment).where(
            MentorPayment.main_internship_id
            == data.main_internship_id
        )
    )

    if existing_payment is not None:
        raise ConflictError(
            "Mentor payment already exists "
            "for this main internship"
        )

    validate_payment_data(
        internship_form_completed=(
            data.internship_form_completed
        ),
        amount=data.amount,
        payment_status=data.payment_status,
        payment_created_at=(
            data.payment_created_at
        ),
        paid_at=data.paid_at,
        non_payment_reason=(
            data.non_payment_reason
        ),
    )

    payment = MentorPayment(
        main_internship_id=(
            data.main_internship_id
        ),
        payment_policy_id=payment_policy.id,
        planned_amount=payment_policy.amount,
        internship_form_completed=(
            data.internship_form_completed
        ),
        payment_created_at=(
            data.payment_created_at
        ),
        registration_method=(
            data.registration_method
        ),
        amount=data.amount,
        payment_status=data.payment_status,
        paid_at=data.paid_at,
        non_payment_reason=(
            data.non_payment_reason
        ),
    )

    db.add(payment)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise ConflictError(
            "Mentor payment already exists "
            "for this main internship"
        ) from None

    db.refresh(payment)

    return payment


def update_mentor_payment(
    db: Session,
    payment_id: int,
    data: MentorPaymentUpdate,
) -> MentorPayment:
    payment = db.get(
        MentorPayment,
        payment_id,
    )

    if payment is None:
        raise NotFoundError(
            "Mentor payment not found"
        )

    update_data = data.model_dump(
        exclude_unset=True,
    )

    if not update_data:
        return payment

    target_form_completed = update_data.get(
        "internship_form_completed",
        payment.internship_form_completed,
    )
    target_amount = update_data.get(
        "amount",
        payment.amount,
    )
    target_status = update_data.get(
        "payment_status",
        payment.payment_status,
    )
    target_created_at = update_data.get(
        "payment_created_at",
        payment.payment_created_at,
    )
    target_paid_at = update_data.get(
        "paid_at",
        payment.paid_at,
    )
    target_non_payment_reason = update_data.get(
        "non_payment_reason",
        payment.non_payment_reason,
    )

    validate_payment_data(
        internship_form_completed=target_form_completed,
        amount=target_amount,
        payment_status=target_status,
        payment_created_at=target_created_at,
        paid_at=target_paid_at,
        non_payment_reason=target_non_payment_reason,
    )

    for field, value in update_data.items():
        setattr(payment, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Mentor payment data conflicts "
            "with an existing record"
        ) from None

    db.refresh(payment)

    return payment