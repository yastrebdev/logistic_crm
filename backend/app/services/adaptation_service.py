from collections.abc import Sequence
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.enums.adaptation import (
    AdaptationProcessStatus,
    AdaptationRiskZone,
)
from app.exceptions.base import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)
from app.models import (
    AdaptationPolicy,
    AdaptationProcess,
    AdaptationStage,
    Employee,
    IntroductoryProcess,
    Position,
)
from app.services.adaptation_policy_service import (
    get_applicable_adaptation_policy,
)
from app.schemas.adaptation import (
    AdaptationProcessUpdate,
    AdaptationStageUpdate,
)


def create_adaptation_for_introductory_process(
    db: Session,
    introductory_process: IntroductoryProcess,
) -> AdaptationProcess:
    if introductory_process.end_date is None:
        raise BusinessRuleError(
            "Adaptation cannot be created before "
            "the introductory process is completed"
        )

    existing_process = db.scalar(
        select(AdaptationProcess).where(
            AdaptationProcess.introductory_process_id
            == introductory_process.id
        )
    )

    if existing_process is not None:
        raise ConflictError(
            "Adaptation process already exists "
            "for this introductory process"
        )

    employee = db.get(
        Employee,
        introductory_process.employee_id,
    )

    if employee is None:
        raise NotFoundError(
            "Employee not found"
        )

    if employee.hire_date is None:
        raise BusinessRuleError(
            "Employee hire date is required "
            "to create adaptation"
        )

    if employee.position_id is None:
        raise BusinessRuleError(
            "Employee position is required "
            "to create adaptation"
        )

    position = db.get(
        Position,
        employee.position_id,
    )

    if position is None:
        raise NotFoundError(
            "Employee position not found"
        )

    policy = get_applicable_adaptation_policy(
        db=db,
        position_category=position.category,
        reference_date=employee.hire_date,
    )

    deadline_date = (
        employee.hire_date
        + timedelta(
            days=policy.total_deadline_days
        )
    )

    stage_1_start = (
        employee.hire_date
        + timedelta(
            days=policy.stage_1_start_offset_days
        )
    )

    stage_1_end = (
        stage_1_start
        + timedelta(
            days=policy.stage_1_duration_days
        )
    )

    if stage_1_end > deadline_date:
        raise BusinessRuleError(
            "Adaptation policy produces a first stage "
            "outside the total adaptation deadline"
        )

    adaptation_process = AdaptationProcess(
        introductory_process_id=(
            introductory_process.id
        ),
        policy_id=policy.id,
        deadline_date=deadline_date,
        status=AdaptationProcessStatus.ACTIVE,
    )

    db.add(adaptation_process)
    db.flush()

    stage_1 = AdaptationStage(
        adaptation_process_id=adaptation_process.id,
        stage_number=1,
        planned_start_date=stage_1_start,
        planned_end_date=stage_1_end,
    )

    db.add(stage_1)
    db.flush()

    return adaptation_process


def get_adaptation_processes(
    db: Session,
    introductory_process_id: int | None = None,
) -> Sequence[AdaptationProcess]:
    query = select(AdaptationProcess)

    if introductory_process_id is not None:
        query = query.where(
            AdaptationProcess.introductory_process_id
            == introductory_process_id
        )

    query = query.order_by(
        AdaptationProcess.deadline_date,
        AdaptationProcess.id,
    )

    return db.scalars(query).all()


def get_adaptation_process_details(
    db: Session,
    adaptation_process_id: int,
) -> AdaptationProcess:
    process = db.scalar(
        select(AdaptationProcess)
        .options(
            selectinload(
                AdaptationProcess.policy
            ),
            selectinload(
                AdaptationProcess.stages
            ),
        )
        .where(
            AdaptationProcess.id
            == adaptation_process_id
        )
    )

    if process is None:
        raise NotFoundError(
            "Adaptation process not found"
        )

    return process


def get_adaptation_stage(
    db: Session,
    stage_id: int,
) -> AdaptationStage:
    stage = db.get(
        AdaptationStage,
        stage_id,
    )

    if stage is None:
        raise NotFoundError(
            "Adaptation stage not found"
        )

    return stage


def validate_adaptation_stage(
    stage: AdaptationStage,
    actual_date,
    method,
    participants,
    delay_reason,
    risk_zone,
    risk_reason,
) -> None:
    if actual_date is None:
        return

    if method is None:
        raise BusinessRuleError(
            "Adaptation method is required "
            "for a completed stage"
        )

    if participants is None:
        raise BusinessRuleError(
            "Adaptation participants are required "
            "for a completed stage"
        )

    is_late = actual_date > stage.planned_end_date

    if is_late and delay_reason is None:
        raise BusinessRuleError(
            "Delay reason is required "
            "for an overdue adaptation stage"
        )

    if not is_late and delay_reason is not None:
        raise BusinessRuleError(
            "Delay reason can only be specified "
            "for an overdue adaptation stage"
        )

    if (
        risk_reason is not None
        and risk_zone is None
    ):
        raise BusinessRuleError(
            "Risk zone is required when "
            "a risk reason is specified"
        )


def calculate_next_stage_dates(
    process: AdaptationProcess,
    policy: AdaptationPolicy,
    previous_stage: AdaptationStage,
) -> tuple:
    if previous_stage.actual_date is None:
        raise BusinessRuleError(
            "Previous adaptation stage is not completed"
        )

    is_red = (
            previous_stage.risk_zone
            == AdaptationRiskZone.RED
    )

    if previous_stage.stage_number == 1:
        offset_days = (
            policy.stage_2_red_offset_days
            if is_red
            else policy.stage_2_normal_offset_days
        )

        planned_start = (
            previous_stage.actual_date
            + timedelta(days=offset_days)
        )

        planned_end = (
            planned_start
            + timedelta(
                days=policy.stage_2_duration_days
            )
        )

        return planned_start, planned_end

    if previous_stage.stage_number == 2:
        offset_days = (
            policy.stage_3_red_offset_days
            if is_red
            else policy.stage_3_normal_offset_days
        )

        calculated_start = (
            previous_stage.actual_date
            + timedelta(days=offset_days)
        )

        # Если второй этап завершён уже после общего
        # дедлайна, третий этап сразу считается просроченным.
        planned_start = min(
            calculated_start,
            process.deadline_date,
        )

        planned_end = process.deadline_date

        return planned_start, planned_end

    raise BusinessRuleError(
        "The third stage has no next stage"
    )


def create_or_update_next_stage(
    db: Session,
    process: AdaptationProcess,
    previous_stage: AdaptationStage,
) -> AdaptationStage:
    if previous_stage.stage_number >= 3:
        raise BusinessRuleError(
            "The third stage has no next stage"
        )

    policy = db.get(
        AdaptationPolicy,
        process.policy_id,
    )

    if policy is None:
        raise NotFoundError(
            "Adaptation policy not found"
        )

    next_stage_number = (
        previous_stage.stage_number + 1
    )

    planned_start, planned_end = (
        calculate_next_stage_dates(
            process=process,
            policy=policy,
            previous_stage=previous_stage,
        )
    )

    next_stage = db.scalar(
        select(AdaptationStage).where(
            AdaptationStage.adaptation_process_id
            == process.id,
            AdaptationStage.stage_number
            == next_stage_number,
        )
    )

    if next_stage is None:
        next_stage = AdaptationStage(
            adaptation_process_id=process.id,
            stage_number=next_stage_number,
            planned_start_date=planned_start,
            planned_end_date=planned_end,
        )

        db.add(next_stage)
    else:
        next_stage.planned_start_date = planned_start
        next_stage.planned_end_date = planned_end

    db.flush()

    return next_stage


def update_adaptation_stage(
    db: Session,
    stage_id: int,
    data: AdaptationStageUpdate,
) -> AdaptationStage:
    stage = db.get(
        AdaptationStage,
        stage_id,
    )

    if stage is None:
        raise NotFoundError(
            "Adaptation stage not found"
        )

    process = db.get(
        AdaptationProcess,
        stage.adaptation_process_id,
    )

    if process is None:
        raise NotFoundError(
            "Adaptation process not found"
        )

    update_data = data.model_dump(
        exclude_unset=True,
    )

    if not update_data:
        return stage

    target_actual_date = update_data.get(
        "actual_date",
        stage.actual_date,
    )
    target_method = update_data.get(
        "method",
        stage.method,
    )
    target_participants = update_data.get(
        "participants",
        stage.participants,
    )
    target_delay_reason = update_data.get(
        "delay_reason",
        stage.delay_reason,
    )
    target_risk_zone = update_data.get(
        "risk_zone",
        stage.risk_zone,
    )
    target_risk_reason = update_data.get(
        "risk_reason",
        stage.risk_reason,
    )

    later_stage = db.scalar(
        select(AdaptationStage).where(
            AdaptationStage.adaptation_process_id
            == process.id,
            AdaptationStage.stage_number
            > stage.stage_number,
        )
    )

    if (
        stage.actual_date is not None
        and target_actual_date is None
        and later_stage is not None
    ):
        raise BusinessRuleError(
            "Completed adaptation stage cannot be "
            "reopened after the next stage was created"
        )

    validate_adaptation_stage(
        stage=stage,
        actual_date=target_actual_date,
        method=target_method,
        participants=target_participants,
        delay_reason=target_delay_reason,
        risk_zone=target_risk_zone,
        risk_reason=target_risk_reason,
    )

    for field, value in update_data.items():
        setattr(stage, field, value)

    try:
        db.flush()

        if stage.actual_date is not None:
            if stage.stage_number < 3:
                create_or_update_next_stage(
                    db=db,
                    process=process,
                    previous_stage=stage,
                )

            if stage.stage_number == 3:
                process.status = (
                    AdaptationProcessStatus.COMPLETED
                )
                process.completed_at = datetime.now(
                    timezone.utc
                )

        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Adaptation stage data conflicts "
            "with an existing record"
        ) from None

    db.refresh(stage)

    return stage


def update_adaptation_process(
    db: Session,
    adaptation_process_id: int,
    data: AdaptationProcessUpdate,
) -> AdaptationProcess:
    process = db.get(
        AdaptationProcess,
        adaptation_process_id,
    )

    if process is None:
        raise NotFoundError(
            "Adaptation process not found"
        )

    update_data = data.model_dump(
        exclude_unset=True,
    )

    if not update_data:
        return process

    probation_result = update_data.get(
        "probation_completed_successfully"
    )

    if (
        probation_result is not None
        and process.status
        != AdaptationProcessStatus.COMPLETED
    ):
        raise BusinessRuleError(
            "Probation result can only be set "
            "after adaptation is completed"
        )

    for field, value in update_data.items():
        setattr(process, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise ConflictError(
            "Adaptation process data conflicts "
            "with an existing record"
        ) from None

    db.refresh(process)

    return process