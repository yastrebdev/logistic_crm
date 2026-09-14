from datetime import date
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Numeric,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.database import Base


class InternshipPolicy(Base):
    __tablename__ = "internship_policies"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    position_id: Mapped[int] = mapped_column(
        ForeignKey(
            "positions.id",
            ondelete="RESTRICT",
        ),
        index=True,
        nullable=False,
    )

    effective_from: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    effective_to: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    duration_min_days: Mapped[int] = mapped_column(
        nullable=False,
    )

    duration_max_days: Mapped[int] = mapped_column(
        nullable=False,
    )

    probation_months: Mapped[int] = mapped_column(
        nullable=False,
    )

    position: Mapped["Position"] = relationship(
        back_populates="internship_policies",
    )

    mentor_payment_policy: Mapped[
        "MentorPaymentPolicy | None"
    ] = relationship(
        back_populates="internship_policy",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )

    main_internships: Mapped[
        list["MainInternship"]
    ] = relationship(
        back_populates="internship_policy",
        passive_deletes="all",
    )

    __table_args__ = (
        UniqueConstraint(
            "position_id",
            "effective_from",
            name=(
                "uq_internship_policy_"
                "position_effective_from"
            ),
        ),
        CheckConstraint(
            "effective_to IS NULL "
            "OR effective_to >= effective_from",
            name="ck_internship_policy_effective_dates",
        ),
        CheckConstraint(
            "duration_min_days > 0",
            name="ck_internship_policy_min_duration",
        ),
        CheckConstraint(
            "duration_max_days >= duration_min_days",
            name="ck_internship_policy_duration_range",
        ),
        CheckConstraint(
            "probation_months > 0",
            name="ck_internship_policy_probation_months",
        ),
    )


class MentorPaymentPolicy(Base):
    __tablename__ = "mentor_payment_policies"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    internship_policy_id: Mapped[int] = mapped_column(
        ForeignKey(
            "internship_policies.id",
            ondelete="CASCADE",
        ),
        unique=True,
        index=True,
        nullable=False,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    internship_policy: Mapped[
        "InternshipPolicy"
    ] = relationship(
        back_populates="mentor_payment_policy",
    )

    mentor_payments: Mapped[
        list["MentorPayment"]
    ] = relationship(
        back_populates="payment_policy",
        passive_deletes="all",
    )

    __table_args__ = (
        CheckConstraint(
            "amount >= 0",
            name="ck_mentor_payment_policy_amount",
        ),
    )