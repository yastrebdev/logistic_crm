from datetime import date, datetime

from pydantic import (
    BaseModel,
    computed_field,
    ConfigDict,
    Field,
    model_validator,
)

from app.enums.adaptation import (
    AdaptationDelayReason,
    AdaptationParticipants,
    AdaptationProcessStatus,
    AdaptationRiskReason,
    MethodExecutionAdaptation,
    AdaptationRiskZone,
    AdaptationZone,
)
from app.enums.organization import PositionCategory


class AdaptationPolicyBase(BaseModel):
    effective_from: date
    effective_to: date | None = None
    position_category: PositionCategory

    stage_1_start_offset_days: int = Field(ge=0)
    stage_1_duration_days: int = Field(gt=0)

    stage_2_red_offset_days: int = Field(ge=0)
    stage_2_normal_offset_days: int = Field(ge=0)
    stage_2_duration_days: int = Field(gt=0)

    stage_3_red_offset_days: int = Field(ge=0)
    stage_3_normal_offset_days: int = Field(ge=0)
    stage_3_duration_days: int = Field(gt=0)

    total_deadline_days: int = Field(
        default=91,
        gt=0,
    )

    @model_validator(mode="after")
    def validate_effective_dates(self):
        if (
            self.effective_to is not None
            and self.effective_to < self.effective_from
        ):
            raise ValueError(
                "effective_to cannot be earlier "
                "than effective_from"
            )

        return self


class AdaptationPolicyCreate(AdaptationPolicyBase):
    pass


class AdaptationPolicyUpdate(BaseModel):
    effective_from: date | None = None
    effective_to: date | None = None
    position_category: PositionCategory | None = None

    stage_1_start_offset_days: int | None = Field(
        default=None,
        ge=0,
    )
    stage_1_duration_days: int | None = Field(
        default=None,
        gt=0,
    )

    stage_2_red_offset_days: int | None = Field(
        default=None,
        ge=0,
    )
    stage_2_normal_offset_days: int | None = Field(
        default=None,
        ge=0,
    )
    stage_2_duration_days: int | None = Field(
        default=None,
        gt=0,
    )

    stage_3_red_offset_days: int | None = Field(
        default=None,
        ge=0,
    )
    stage_3_normal_offset_days: int | None = Field(
        default=None,
        ge=0,
    )
    stage_3_duration_days: int | None = Field(
        default=None,
        gt=0,
    )

    total_deadline_days: int | None = Field(
        default=None,
        gt=0,
    )

    @model_validator(mode="after")
    def validate_null_values(self):
        nullable_fields = {
            "effective_to",
        }

        for field in self.model_fields_set:
            if (
                field not in nullable_fields
                and getattr(self, field) is None
            ):
                raise ValueError(
                    f"{field} cannot be null"
                )

        if (
            self.effective_from is not None
            and self.effective_to is not None
            and self.effective_to < self.effective_from
        ):
            raise ValueError(
                "effective_to cannot be earlier "
                "than effective_from"
            )

        return self


class AdaptationPolicyResponse(
    AdaptationPolicyBase
):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
    )


class AdaptationStageUpdate(BaseModel):
    actual_date: date | None = None
    method: MethodExecutionAdaptation | None = None
    participants: AdaptationParticipants | None = None
    delay_reason: AdaptationDelayReason | None = None
    risk_zone: AdaptationRiskZone | None = None
    risk_reason: AdaptationRiskReason | None = None
    comment: str | None = Field(
        default=None,
        max_length=2000,
    )


class AdaptationStageResponse(BaseModel):
    id: int
    adaptation_process_id: int
    stage_number: int

    planned_start_date: date
    planned_end_date: date
    actual_date: date | None

    method: MethodExecutionAdaptation | None
    participants: AdaptationParticipants | None
    delay_reason: AdaptationDelayReason | None
    risk_zone: AdaptationRiskZone | None
    risk_reason: AdaptationRiskReason | None
    comment: str | None

    model_config = ConfigDict(
        from_attributes=True,
    )

    @computed_field
    @property
    def delay_days(self) -> int:
        comparison_date = self.actual_date or date.today()

        if comparison_date <= self.planned_end_date:
            return 0

        return (
            comparison_date - self.planned_end_date
        ).days

    @computed_field
    @property
    def is_overdue(self) -> bool:
        return self.delay_days > 0

    @computed_field
    @property
    def stage_status(self) -> str:
        if self.actual_date is not None:
            return "completed"

        today = date.today()

        if today < self.planned_start_date:
            return "upcoming"

        if today <= self.planned_end_date:
            return "due"

        return "overdue"

    @computed_field
    @property
    def zone(self) -> AdaptationZone | None:
        if self.actual_date is None:
            return None

        return AdaptationZone.YELLOW


class AdaptationProcessUpdate(BaseModel):
    probation_completed_successfully: (
        bool | None
    ) = None


class AdaptationProcessResponse(BaseModel):
    id: int
    introductory_process_id: int
    policy_id: int
    deadline_date: date
    status: AdaptationProcessStatus
    created_at: datetime
    completed_at: datetime | None

    probation_completed_successfully: bool | None

    model_config = ConfigDict(
        from_attributes=True,
    )


class AdaptationProcessDetailResponse(
    AdaptationProcessResponse
):
    policy: AdaptationPolicyResponse
    stages: list[AdaptationStageResponse]