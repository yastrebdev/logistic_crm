from datetime import date
from decimal import Decimal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


class InternshipPolicyBase(BaseModel):
    position_id: int = Field(gt=0)

    effective_from: date
    effective_to: date | None = None

    duration_min_days: int = Field(gt=0)
    duration_max_days: int = Field(gt=0)

    probation_months: int = Field(gt=0)

    @model_validator(mode="after")
    def validate_policy(self):
        if (
            self.effective_to is not None
            and self.effective_to
            < self.effective_from
        ):
            raise ValueError(
                "effective_to cannot be earlier "
                "than effective_from"
            )

        if (
            self.duration_max_days
            < self.duration_min_days
        ):
            raise ValueError(
                "duration_max_days cannot be less "
                "than duration_min_days"
            )

        return self


class InternshipPolicyCreate(
    InternshipPolicyBase
):
    mentor_payment_amount: Decimal = Field(
        ge=0,
        max_digits=10,
        decimal_places=2,
    )


class InternshipPolicyUpdate(BaseModel):
    position_id: int | None = Field(
        default=None,
        gt=0,
    )

    effective_from: date | None = None
    effective_to: date | None = None

    duration_min_days: int | None = Field(
        default=None,
        gt=0,
    )

    duration_max_days: int | None = Field(
        default=None,
        gt=0,
    )

    probation_months: int | None = Field(
        default=None,
        gt=0,
    )

    mentor_payment_amount: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=10,
        decimal_places=2,
    )

    @model_validator(mode="after")
    def validate_null_values(self):
        required_fields = (
            "position_id",
            "effective_from",
            "duration_min_days",
            "duration_max_days",
            "probation_months",
            "mentor_payment_amount",
               )

        for field in required_fields:
            if (
                field in self.model_fields_set
                and getattr(self, field) is None
            ):
                raise ValueError(
                    f"{field} cannot be null"
                )

        if (
            self.effective_from is not None
            and self.effective_to is not None
            and self.effective_to
            < self.effective_from
        ):
            raise ValueError(
                "effective_to cannot be earlier "
                "than effective_from"
            )

        if (
            self.duration_min_days is not None
            and self.duration_max_days is not None
            and self.duration_max_days
            < self.duration_min_days
        ):
            raise ValueError(
                "duration_max_days cannot be less "
                "than duration_min_days"
            )

        return self


class MentorPaymentPolicyResponse(BaseModel):
    id: int
    internship_policy_id: int
    amount: Decimal

    model_config = ConfigDict(
        from_attributes=True,
    )


class InternshipPolicyResponse(
    InternshipPolicyBase
):
    id: int

    mentor_payment_policy: (
        MentorPaymentPolicyResponse | None
    )

    model_config = ConfigDict(
        from_attributes=True,
    )