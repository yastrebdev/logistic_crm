from datetime import date
from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)

from app.enums.mentor_payment import (
    NonPaymentReason,
    PaymentStatus,
    PaymentRegistrationMethod,
)


class MentorPaymentCreate(BaseModel):
    main_internship_id: int = Field(gt=0)
    internship_form_completed: bool
    payment_created_at: date | None = None
    registration_method: (
        PaymentRegistrationMethod | None
    ) = None
    amount: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )
    payment_status: PaymentStatus = PaymentStatus.PENDING
    paid_at: date | None = None
    non_payment_reason: NonPaymentReason | None = None

    @model_validator(mode="after")
    def validate_payment(self):
        if (
            self.payment_status == PaymentStatus.PAID
            and self.paid_at is None
        ):
            raise ValueError(
                "paid_at is required for a paid payment"
            )

        if (
            self.paid_at is not None
            and self.payment_status != PaymentStatus.PAID
        ):
            raise ValueError(
                "paid_at can only be specified "
                "for a paid payment"
            )

        if (
            self.payment_status == PaymentStatus.CANCELLED
            and self.non_payment_reason is None
        ):
            raise ValueError(
                "non_payment_reason is required "
                "for a cancelled payment"
            )

        return self


class MentorPaymentUpdate(BaseModel):
    internship_form_completed: bool | None = None
    payment_created_at: date | None = None
    registration_method: (
        PaymentRegistrationMethod | None
    ) = None
    amount: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )
    payment_status: PaymentStatus | None = None
    paid_at: date | None = None
    non_payment_reason: NonPaymentReason | None = None

    @model_validator(mode="after")
    def validate_null_values(self):
        required_fields = (
            "internship_form_completed",
            "payment_status",
        )

        for field in required_fields:
            if (
                field in self.model_fields_set
                and getattr(self, field) is None
            ):
                raise ValueError(
                    f"{field} cannot be null"
                )

        return self


class MentorPaymentResponse(BaseModel):
    id: int
    main_internship_id: int
    payment_policy_id: int | None
    planned_amount: Decimal | None
    internship_form_completed: bool
    payment_created_at: date | None
    registration_method: (
        PaymentRegistrationMethod | None
    )
    amount: Decimal | None
    payment_status: PaymentStatus
    paid_at: date | None
    non_payment_reason: NonPaymentReason | None

    model_config = ConfigDict(
        from_attributes=True,
    )