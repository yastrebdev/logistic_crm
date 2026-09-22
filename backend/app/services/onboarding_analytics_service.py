from datetime import date, timedelta

from sqlalchemy import (
    and_,
    func,
    or_,
    select,
)
from sqlalchemy.orm import (
    Session,
    joinedload,
    selectinload,
)

from app.enums.mentor_payment import (
    PaymentStatus,
)
from app.enums.adaptation import AdaptationRiskZone
from app.enums.organization import (
    PositionCategory,
)
from app.models import (
    AdaptationProcess,
    AdaptationStage,
    Division,
    DistributionCenterDivision,
    Employee,
    InternshipPolicy,
    IntroductoryInternship,
    IntroductoryProcess,
    MainInternship,
    MentorPayment,
    MentorPaymentPolicy,
    Position,
)
from app.schemas.onboarding_analytics import (
    OnboardingAnalyticsRow,
)


def get_onboarding_analytics(
    db: Session,
    page: int,
    page_size: int,
    distribution_center_id: int | None = None,
    division_group_id: int | None = None,
    division_id: int | None = None,
    position_id: int | None = None,
    tutor_id: int | None = None,
    hire_date_from: date | None = None,
    hire_date_to: date | None = None,
    employee_search: str | None = None,
    overdue_only: bool = False,
    has_risk_only: bool = False,
    payment_pending_only: bool = False,
) -> tuple[int, list[OnboardingAnalyticsRow]]:
    conditions = []

    if distribution_center_id is not None:
        conditions.append(
            IntroductoryProcess.employee.has(
                Employee
                .distribution_center_division
                .has(
                    DistributionCenterDivision
                    .distribution_center_id
                    == distribution_center_id
                )
            )
        )

    if division_id is not None:
        conditions.append(
            IntroductoryProcess.employee.has(
                Employee
                .distribution_center_division
                .has(
                    DistributionCenterDivision
                    .division_id
                    == division_id
                )
            )
        )

    if division_group_id is not None:
        conditions.append(
            IntroductoryProcess.employee.has(
                Employee
                .distribution_center_division
                .has(
                    DistributionCenterDivision
                    .division.has(
                        Division.division_group_id
                        == division_group_id
                    )
                )
            )
        )

    if position_id is not None:
        conditions.append(
            IntroductoryProcess.employee.has(
                Employee.position_id
                == position_id
            )
        )

    if tutor_id is not None:
        conditions.append(
            IntroductoryProcess.tutor_id
            == tutor_id
        )

    if hire_date_from is not None:
        conditions.append(
            IntroductoryProcess.employee.has(
                Employee.hire_date
                >= hire_date_from
            )
        )

    if hire_date_to is not None:
        conditions.append(
            IntroductoryProcess.employee.has(
                Employee.hire_date
                <= hire_date_to
            )
        )

    total_query = select(
        func.count(
            IntroductoryProcess.id
        )
    )

    if employee_search is not None:
        normalized_search = (
            employee_search.strip()
        )

        if normalized_search:
            search_pattern = (
                f"%{normalized_search}%"
            )

            conditions.append(
                IntroductoryProcess.employee.has(
                    or_(
                        Employee.full_name.ilike(
                            search_pattern
                        ),
                        Employee.personnel_number.ilike(
                            search_pattern
                        ),
                    )
                )
            )

    if overdue_only:
        conditions.append(
            IntroductoryProcess
            .adaptation_process
            .has(
                AdaptationProcess.stages.any(
                    and_(
                        AdaptationStage.actual_date
                        .is_(None),
                        AdaptationStage
                        .planned_end_date
                        < date.today(),
                    )
                )
            )
        )

    if has_risk_only:
        conditions.append(
            IntroductoryProcess
            .adaptation_process
            .has(
                AdaptationProcess.stages.any(
                    AdaptationStage.risk_zone
                    == AdaptationRiskZone.RED
                )
            )
        )

    if payment_pending_only:
        conditions.append(
            IntroductoryProcess
            .main_internships
            .any(
                and_(
                    MainInternship.mentor_id
                    .is_not(None),

                    MainInternship
                    .internship_policy
                    .has(
                        InternshipPolicy
                        .mentor_payment_policy
                        .has(
                            MentorPaymentPolicy
                            .amount > 0
                        )
                    ),

                    or_(
                        ~MainInternship
                        .mentor_payment
                        .has(),

                        MainInternship
                        .mentor_payment
                        .has(
                            or_(
                                MentorPayment
                                .payment_status
                                != PaymentStatus.PAID,

                                MentorPayment
                                .planned_amount
                                .is_(None),

                                MentorPayment
                                .amount
                                .is_(None),

                                MentorPayment.amount
                                < MentorPayment
                                .planned_amount,
                            )
                        ),
                    ),
                )
            )
        )

    if conditions:
        total_query = total_query.where(
            *conditions
        )

    total = db.scalar(total_query) or 0

    query = (
        select(IntroductoryProcess)
        .options(
            joinedload(
                IntroductoryProcess.employee
            ).joinedload(
                Employee.manager
            ),

            joinedload(IntroductoryProcess.employee)
            .joinedload(Employee.position)
            .joinedload(Position.division)
            .joinedload(Division.division_group),

            joinedload(IntroductoryProcess.employee)
            .joinedload(Employee.distribution_center_division)
            .joinedload(DistributionCenterDivision.distribution_center),

            joinedload(IntroductoryProcess.employee)
            .joinedload(Employee.distribution_center_division)
            .joinedload(DistributionCenterDivision.division)
            .joinedload(Division.division_group),

            joinedload(
                IntroductoryProcess.tutor
            ),

            selectinload(
                IntroductoryProcess.introductory_internships
            ).joinedload(
                IntroductoryInternship.mentor
            ),

            selectinload(
                IntroductoryProcess.trainings
            ),

            selectinload(
                IntroductoryProcess
                .main_internships
            ).joinedload(
                MainInternship.mentor
            ).joinedload(
                Employee.position
            ),

            selectinload(
                IntroductoryProcess.main_internships
            ).joinedload(
                MainInternship.internship_policy
            ).joinedload(
                InternshipPolicy.mentor_payment_policy
            ),

            selectinload(
                IntroductoryProcess
                .main_internships
            ).joinedload(
                MainInternship
                .mentor_payment
            ),

            joinedload(
                IntroductoryProcess
                .adaptation_process
            ).selectinload(
                AdaptationProcess.stages
            ),
        )
        .order_by(
            IntroductoryProcess.id.desc()
        )
        .offset(
            (page - 1) * page_size
        )
        .limit(page_size)
    )

    if conditions:
        query = query.where(*conditions)

    processes = db.scalars(
        query
    ).unique().all()

    today = date.today()

    rows = [
        _build_analytics_row(
            process=process,
            today=today,
        )
        for process in processes
    ]

    return total, rows


def _build_analytics_row(
    process: IntroductoryProcess,
    today: date,
) -> OnboardingAnalyticsRow:
    employee = process.employee
    tutor = process.tutor

    center_unit = (
        employee.distribution_center_division
    )

    center = (
        center_unit.distribution_center
        if center_unit is not None
        else None
    )

    division = (
        center_unit.division
        if center_unit is not None
        else None
    )

    division_group = (
        division.division_group
        if division is not None
        else None
    )

    position = employee.position
    manager = employee.manager

    introductory_internship = _latest_by_date(
        process.introductory_internships,
        "internship_date",
    )

    training = _latest_by_date(
        process.trainings,
        "training_date",
    )

    main_internship = _latest_by_date(
        process.main_internships,
        "start_date",
    )

    introductory_mentor = (
        introductory_internship.mentor
        if introductory_internship
        is not None
        else None
    )

    internship_policy = (
        main_internship.internship_policy
        if main_internship is not None
        else None
    )

    main_mentor = (
        main_internship.mentor
        if main_internship is not None
        else None
    )

    payment = (
        main_internship.mentor_payment
        if main_internship is not None
        else None
    )

    actual_duration_days = None

    if (
        main_internship is not None
        and main_internship.end_date
        is not None
    ):
        actual_duration_days = (
            main_internship.end_date
            - main_internship.start_date
        ).days + 1

    duration_compliant = None

    if (
        actual_duration_days is not None
        and internship_policy is not None
    ):
        duration_compliant = (
            internship_policy
            .duration_min_days
            <= actual_duration_days
            <= internship_policy
            .duration_max_days
        )

    payment_due_date = None

    if (
        employee.hire_date is not None
        and position is not None
    ):
        payment_offset_days = (
            30
            if position.category
            == PositionCategory.LINE_STAFF
            else 90
        )

        payment_due_date = (
            employee.hire_date
            + timedelta(
                days=payment_offset_days
            )
        )

    payment_policy = (
        internship_policy
        .mentor_payment_policy
        if internship_policy is not None
        else None
    )

    mentor_payment_expected = (
        main_mentor is not None
        and payment_policy is not None
        and payment_policy.amount > 0
    )

    payment_is_fully_paid = (
        payment is not None
        and payment.payment_status
        == PaymentStatus.PAID
        and payment.planned_amount
        is not None
        and payment.amount is not None
        and payment.amount
        >= payment.planned_amount
    )

    adaptation = (
        process.adaptation_process
    )

    stages_by_number = {}

    if adaptation is not None:
        stages_by_number = {
            stage.stage_number: stage
            for stage in adaptation.stages
        }

    stage_1 = stages_by_number.get(1)
    stage_2 = stages_by_number.get(2)
    stage_3 = stages_by_number.get(3)

    days_since_hire = (
        (today - employee.hire_date).days
        if employee.hire_date is not None
        else None
    )

    days_since_stage_1 = (
        (today - stage_1.actual_date).days
        if (
            stage_1 is not None
            and stage_1.actual_date
            is not None
        )
        else None
    )

    return OnboardingAnalyticsRow(
        introductory_process_id=process.id,
        employee_id=employee.id,

        distribution_center_id=(
            center.id
            if center is not None
            else None
        ),
        distribution_center_code=(
            center.code
            if center is not None
            else None
        ),
        distribution_center_name=(
            center.name
            if center is not None
            else None
        ),

        distribution_center_division_id=(
            center_unit.id
            if center_unit is not None
            else None
        ),

        division_id=(
            division.id
            if division is not None
            else None
        ),
        division_name=(
            center_unit.name
            if center_unit is not None
            else None
        ),

        division_group_id=(
            division_group.id
            if division_group is not None
            else None
        ),
        division_group_name=(
            division_group.name
            if division_group is not None
            else None
        ),
        division_group_abbreviation=(
            division_group.abbreviation
            if division_group is not None
            else None
        ),

        manager_id=employee.manager_id,
        manager_name=(
            manager.full_name
            if manager is not None
            else None
        ),

        personnel_number=(
            employee.personnel_number
        ),
        employee_name=employee.full_name,

        position_id=employee.position_id,
        position_name=(
            position.name
            if position is not None
            else None
        ),
        position_category=(
            position.category
            if position is not None
            else None
        ),

        hire_date=employee.hire_date,
        reason_not_hiring=(
            employee.reason_not_hiring
        ),
        reason_delayed_hiring=(
            employee.reason_delayed_hiring
        ),
        hiring_comment=(
            employee.hiring_comment
        ),
        candidate_type=(
            employee.candidate_type
        ),

        introductory_start_date=(
            process.start_date
        ),
        introductory_end_date=(
            process.end_date
        ),

        tutor_id=tutor.id,
        tutor_name=tutor.full_name,
        tutor_email=tutor.email,

        introductory_internship_id=(
            introductory_internship.id
            if introductory_internship
            is not None
            else None
        ),
        introductory_internship_date=(
            introductory_internship
            .internship_date
            if introductory_internship
            is not None
            else None
        ),
        introductory_mentor_id=(
            introductory_mentor.id
            if introductory_mentor
            is not None
            else None
        ),
        introductory_mentor_name=(
            introductory_mentor.full_name
            if introductory_mentor
            is not None
            else None
        ),

        training_id=(
            training.id
            if training is not None
            else None
        ),
        training_date=(
            training.training_date
            if training is not None
            else None
        ),
        admission_format=(
            training.admission_format
            if training is not None
            else None
        ),
        test_date=(
            training.test_date
            if training is not None
            else None
        ),
        test_result=(
            training.test_result
            if training is not None
            else None
        ),

        main_internship_id=(
            main_internship.id
            if main_internship
            is not None
            else None
        ),
        main_internship_start_date=(
            main_internship.start_date
            if main_internship
            is not None
            else None
        ),
        main_internship_end_date=(
            main_internship.end_date
            if main_internship
            is not None
            else None
        ),

        internship_duration_min_days=(
            internship_policy
            .duration_min_days
            if internship_policy
            is not None
            else None
        ),
        internship_duration_max_days=(
            internship_policy
            .duration_max_days
            if internship_policy
            is not None
            else None
        ),
        actual_internship_duration_days=(
            actual_duration_days
        ),
        internship_duration_compliant=(
            duration_compliant
        ),

        main_mentor_id=(
            main_mentor.id
            if main_mentor is not None
            else None
        ),
        main_mentor_name=(
            main_mentor.full_name
            if main_mentor is not None
            else None
        ),
        main_mentor_position_name=(
            main_mentor.position.name
            if (
                main_mentor is not None
                and main_mentor.position
                is not None
            )
            else None
        ),

        mentor_assignment_status=(
            main_internship
            .mentor_assignment_status
            if main_internship
            is not None
            else None
        ),

        has_mentor=main_mentor is not None,

        internship_form_completed=(
            payment
            .internship_form_completed
            if payment is not None
            else None
        ),

        mentor_payment_id=(
            payment.id
            if payment is not None
            else None
        ),

        mentor_payment_expected=(
            mentor_payment_expected
        ),
        payment_due_date=payment_due_date,

        planned_payment_amount=(
            payment.planned_amount
            if payment is not None
            else (
                payment_policy.amount
                if payment_policy
                is not None
                else None
            )
        ),

        actual_payment_amount=(
            payment.amount
            if payment is not None
            else None
        ),

        payment_created_at=(
            payment.payment_created_at
            if payment is not None
            else None
        ),
        payment_paid_at=(
            payment.paid_at
            if payment is not None
            else None
        ),
        payment_status=(
            payment.payment_status
            if payment is not None
            else None
        ),
        payment_is_fully_paid=(
            payment_is_fully_paid
        ),
        non_payment_reason=(
            payment.non_payment_reason
            if payment is not None
            else None
        ),
        payment_registration_method=(
            payment.registration_method
            if payment is not None
            else None
        ),

        adaptation_process_id=(
            adaptation.id
            if adaptation is not None
            else None
        ),
        adaptation_status=(
            adaptation.status
            if adaptation is not None
            else None
        ),
        adaptation_deadline_date=(
            adaptation.deadline_date
            if adaptation is not None
            else None
        ),
        days_since_hire=days_since_hire,

        adaptation_stage_1=stage_1,
        days_since_stage_1=(
            days_since_stage_1
        ),
        adaptation_stage_2=stage_2,
        adaptation_stage_3=stage_3,

        probation_completed_successfully=(
            adaptation
            .probation_completed_successfully
            if adaptation is not None
            else None
        ),

        separation_date=(
            employee.separation_date
        ),
        separation_reason=(
            employee.separation_reason
        ),
        manager_separation_feedback=(
            employee
            .manager_separation_feedback
        ),
    )


def _latest_by_date(
    items,
    date_attribute: str,
):
    if not items:
        return None

    return max(
        items,
        key=lambda item: (
            getattr(
                item,
                date_attribute,
            ) or date.min,
            item.id,
        ),
    )