from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from app.enums.adaptation import (
    AdaptationProcessStatus,
)
from app.enums.employee import (
    CandidateType,
    HiringDelayReason,
    HiringRejectionReason,
    SeparationReason,
)
from app.enums.introductory_training import (
    AdmissionFormat,
    MentorAssignmentStatus,
)
from app.enums.mentor_payment import (
    NonPaymentReason,
    PaymentStatus,
)
from app.enums.organization import (
    PositionCategory,
)
from app.schemas.adaptation import (
    AdaptationStageResponse,
)


class OnboardingAnalyticsRow(BaseModel):
    # Идентификаторы
    introductory_process_id: int
    employee_id: int

    # Организационная структура
    distribution_center_id: int | None
    distribution_center_code: str | None
    distribution_center_name: str | None

    distribution_center_division_id: (
        int | None
    )

    division_id: int | None
    division_name: str | None

    division_group_id: int | None
    division_group_name: str | None
    division_group_abbreviation: str | None

    # Сотрудник
    manager_id: int | None
    manager_name: str | None

    personnel_number: str | None
    employee_name: str

    position_id: int | None
    position_name: str | None
    position_category: (
        PositionCategory | None
    )

    hire_date: date | None

    reason_not_hiring: (
        HiringRejectionReason | None
    )

    reason_delayed_hiring: (
        HiringDelayReason | None
    )

    hiring_comment: str | None
    candidate_type: CandidateType

    # Вводный процесс
    introductory_start_date: date
    introductory_end_date: date | None

    tutor_id: int
    tutor_name: str | None
    tutor_email: str

    # Ознакомительная стажировка
    introductory_internship_id: int | None

    introductory_internship_date: (
        date | None
    )

    introductory_mentor_id: int | None
    introductory_mentor_name: str | None

    # Обучение и проверка
    training_id: int | None
    training_date: date | None

    admission_format: AdmissionFormat | None

    test_date: date | None
    test_result: float | None

    # Основная стажировка
    main_internship_id: int | None

    main_internship_start_date: date | None
    main_internship_end_date: date | None

    internship_duration_min_days: (
        int | None
    )

    internship_duration_max_days: (
        int | None
    )

    actual_internship_duration_days: (
        int | None
    )

    internship_duration_compliant: (
        bool | None
    )

    main_mentor_id: int | None
    main_mentor_name: str | None
    main_mentor_position_name: str | None

    mentor_assignment_status: (
        MentorAssignmentStatus | None
    )

    has_mentor: bool
    internship_form_completed: bool | None

    # Оплата наставника
    mentor_payment_id: int | None

    mentor_payment_expected: bool
    payment_due_date: date | None

    planned_payment_amount: Decimal | None
    actual_payment_amount: Decimal | None

    payment_created_at: date | None
    payment_paid_at: date | None

    payment_status: PaymentStatus | None

    payment_is_fully_paid: bool

    non_payment_reason: (
        NonPaymentReason | None
    )

    payment_registration_method: str | None

    # Адаптация
    adaptation_process_id: int | None

    adaptation_status: (
        AdaptationProcessStatus | None
    )

    adaptation_deadline_date: date | None
    days_since_hire: int | None

    adaptation_stage_1: (
        AdaptationStageResponse | None
    )

    days_since_stage_1: int | None

    adaptation_stage_2: (
        AdaptationStageResponse | None
    )

    adaptation_stage_3: (
        AdaptationStageResponse | None
    )

    probation_completed_successfully: (
        bool | None
    )

    # Увольнение
    separation_date: date | None

    separation_reason: (
        SeparationReason | None
    )

    manager_separation_feedback: str | None


class OnboardingAnalyticsListResponse(
    BaseModel
):
    items: list[OnboardingAnalyticsRow]

    total: int
    page: int
    page_size: int