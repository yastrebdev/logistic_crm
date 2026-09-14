from datetime import date
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import  Enum as SQLEnum

from app.db.database import Base
from app.enums.base import enum_values
from app.enums.mentor_payment import PaymentStatus, NonPaymentReason


class MentorPayment(Base):
    __tablename__ = "mentor_payments"

    id: Mapped[int] = mapped_column(primary_key=True)

    main_internship_id: Mapped[int] = mapped_column(
        ForeignKey(
            "main_internships.id",
            ondelete="RESTRICT",
        ),
        unique=True,
        index=True,
        nullable=False,
    )

    payment_policy_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "mentor_payment_policies.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=True,
    )

    planned_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    internship_form_completed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )

    payment_created_at: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    registration_method: Mapped[
        str | None
        ] = mapped_column(
        String(100),
        nullable=True,
    )

    amount: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    payment_status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(
            PaymentStatus,
            values_callable=enum_values,
            name="payment_status",
        ),
        default=PaymentStatus.PENDING,
        nullable=False,
    )

    paid_at: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    non_payment_reason: Mapped[NonPaymentReason | None] = mapped_column(
        SQLEnum(
            NonPaymentReason,
            values_callable=enum_values,
            name="non_payment_reason",
        ),
        nullable=True,
    )

    main_internship: Mapped["MainInternship"] = relationship(
        back_populates="mentor_payment",
    )

    payment_policy: Mapped[
        "MentorPaymentPolicy | None"
    ] = relationship(
        back_populates="mentor_payments",
    )
