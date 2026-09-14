from datetime import date

from pydantic import BaseModel, ConfigDict

from app.enums.employee import (
    CandidateType,
    HiringDelayReason,
    HiringRejectionReason,
    SeparationReason,
)


class EmployeeBase(BaseModel):
    manager_id: int | None = None
    distribution_center_division_id: int | None = None
    position_id: int | None = None

    personnel_number: str | None = None
    full_name: str

    hire_date: date | None = None
    reason_not_hiring: HiringRejectionReason | None = None
    reason_delayed_hiring: HiringDelayReason | None = None
    hiring_comment: str | None = None

    separation_date: date | None = None
    separation_reason: SeparationReason | None = None
    manager_separation_feedback: str | None = None

    candidate_type: CandidateType


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    manager_id: int | None = None
    distribution_center_division_id: int | None = None
    position_id: int | None = None

    personnel_number: str | None = None

    hire_date: date | None = None
    reason_not_hiring: HiringRejectionReason | None = None
    reason_delayed_hiring: HiringDelayReason | None = None
    hiring_comment: str | None = None

    separation_date: date | None = None
    separation_reason: SeparationReason | None = None
    manager_separation_feedback: str | None = None


class EmployeeResponse(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int