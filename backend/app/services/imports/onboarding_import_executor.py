from collections import defaultdict
from datetime import (
    date,
    datetime,
    time,
    timedelta,
    timezone,
)
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.enums.data_import import (
    ImportRowStatus,
    ImportStatus,
)

from app.enums.employee import (
    CandidateType,
    HiringDelayReason,
    HiringRejectionReason,
    SeparationReason,
)
from app.exceptions.base import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)
from app.models import (
    AdaptationProcess,
    AdaptationStage,
    Employee,
    ImportJob,
    ImportJobRow,
    IntroductoryInternship,
    IntroductoryProcess,
    MainInternship,
    MentorPayment,
    Position,
    Training,
)
from app.enums.introductory_training import (
    AdmissionFormat,
    MentorAssignmentStatus,
)
from app.enums.mentor_payment import (
    NonPaymentReason,
    PaymentRegistrationMethod,
    PaymentStatus,
)
from app.enums.adaptation import (
    AdaptationDelayReason,
    AdaptationParticipants,
    AdaptationProcessStatus,
    AdaptationRiskReason,
    AdaptationRiskZone,
    MethodExecutionAdaptation,
)

from app.services.adaptation_policy_service import (
    get_applicable_adaptation_policy,
)


def _key(value: Any) -> str:
    if value is None:
        return ""

    return " ".join(
        str(value)
        .replace("\xa0", " ")
        .replace("ё", "е")
        .casefold()
        .split()
    )


def _date(value: Any) -> date | None:
    if value is None or value == "":
        return None

    if isinstance(value, date):
        return value

    return date.fromisoformat(str(value))


def create_import_employees(
    db: Session,
    rows: list[ImportJobRow],
) -> dict[int, Employee]:
    employees_by_row_id: dict[
        int,
        Employee,
    ] = {}

    employees_by_personnel_number: dict[
        str,
        Employee,
    ] = {}

    for row in rows:
        data = row.normalized_data or {}

        personnel_number = data.get(
            "personnel_number"
        )

        personnel_number_key = (
            str(personnel_number)
            .strip()
            .casefold()
            if personnel_number
            else None
        )

        employee = None

        if personnel_number_key:
            employee = (
                employees_by_personnel_number
                .get(personnel_number_key)
            )

        if employee is None:
            employee = Employee(
                distribution_center_division_id=(
                    data[
                        "distribution_center_division_id"
                    ]
                ),
                position_id=data["position_id"],
                personnel_number=personnel_number,
                full_name=data["employee_name"],
                hire_date=_date(
                    data.get("hire_date")
                ),
                reason_not_hiring=(
                    HiringRejectionReason(
                        data[
                            "reason_not_hiring_value"
                        ]
                    )
                    if data.get(
                        "reason_not_hiring_value"
                    )
                    else None
                ),
                reason_delayed_hiring=(
                    HiringDelayReason(
                        data[
                            "reason_delayed_hiring_value"
                        ]
                    )
                    if data.get(
                        "reason_delayed_hiring_value"
                    )
                    else None
                ),
                hiring_comment=data.get(
                    "hiring_comment"
                ),
                candidate_type=(
                    CandidateType(
                        data[
                            "candidate_type_value"
                        ]
                    )
                ),
                separation_date=_date(
                    data.get(
                        "separation_date"
                    )
                ),
                separation_reason=(
                    SeparationReason(
                        data[
                            "separation_reason_value"
                        ]
                    )
                    if data.get(
                        "separation_reason_value"
                    )
                    else None
                ),
                manager_separation_feedback=(
                    data.get(
                        "manager_separation_feedback"
                    )
                ),
            )

            db.add(employee)
            db.flush()

            if personnel_number_key:
                employees_by_personnel_number[
                    personnel_number_key
                ] = employee

        employees_by_row_id[
            row.id
        ] = employee

        row.result_data = {
            "employee_id": employee.id,
        }

    return employees_by_row_id


def build_employee_name_index(
    employees_by_row_id: dict[
        int,
        Employee,
    ],
) -> dict[str, list[Employee]]:
    employees_by_name: dict[
        str,
        list[Employee],
    ] = defaultdict(list)

    for employee in employees_by_row_id.values():
        employees_by_name[
            _key(employee.full_name)
        ].append(employee)

    return employees_by_name


def resolve_employee_by_name(
    name: Any,
    employees_by_name: dict[
        str,
        list[Employee],
    ],
) -> Employee | None:
    if not name:
        return None

    matches = employees_by_name.get(
        _key(name),
        [],
    )

    if len(matches) != 1:
        return None

    return matches[0]


def assign_import_managers(
    rows: list[ImportJobRow],
    employees_by_row_id: dict[
        int,
        Employee,
    ],
    employees_by_name: dict[
        str,
        list[Employee],
    ],
) -> None:
    for row in rows:
        data = row.normalized_data or {}

        manager_name = data.get(
            "manager_name"
        )

        if not manager_name:
            continue

        manager = resolve_employee_by_name(
            name=manager_name,
            employees_by_name=(
                employees_by_name
            ),
        )

        if manager is None:
            continue

        employee = employees_by_row_id[
            row.id
        ]

        if employee.id != manager.id:
            employee.manager_id = manager.id


def create_import_introductory_data(
    db: Session,
    rows: list[ImportJobRow],
    employees_by_row_id: dict[
        int,
        Employee,
    ],
    employees_by_name: dict[
        str,
        list[Employee],
    ],
) -> None:
    for row in rows:
        data = row.normalized_data or {}

        employee = employees_by_row_id[
            row.id
        ]

        process_start_date = (
            _get_process_start_date(data)
        )

        # Если в строке вообще нет дат вводного
        # процесса, сохраняем только сотрудника.
        if process_start_date is None:
            continue

        process = IntroductoryProcess(
            employee_id=employee.id,
            tutor_id=data["tutor_id"],
            start_date=process_start_date,
            end_date=_date(
                data.get("hire_date")
            ),
        )

        db.add(process)
        db.flush()

        result_data = dict(
            row.result_data or {}
        )

        result_data[
            "introductory_process_id"
        ] = process.id

        introductory_internship_date = (
            _date(
                data.get(
                    "introductory_internship_date"
                )
            )
        )

        if introductory_internship_date:
            introductory_mentor = (
                resolve_employee_by_name(
                    name=data.get(
                        "introductory_mentor_name"
                    ),
                    employees_by_name=(
                        employees_by_name
                    ),
                )
            )

            if introductory_mentor is not None:
                internship = (
                    IntroductoryInternship(
                        introductory_process_id=(
                            process.id
                        ),
                        mentor_id=(
                            introductory_mentor.id
                        ),
                        internship_date=(
                            introductory_internship_date
                        ),
                    )
                )

                db.add(internship)
                db.flush()

                result_data[
                    "introductory_internship_id"
                ] = internship.id

        if _has_training_data(data):
            training = Training(
                introductory_process_id=(
                    process.id
                ),
                training_date=_date(
                    data.get("training_date")
                ),
                admission_format=(
                    AdmissionFormat(
                        data[
                            "admission_format_value"
                        ]
                    )
                ),
                test_date=_date(
                    data.get("test_date")
                ),
                test_result=data.get(
                    "test_result"
                ),
            )

            db.add(training)
            db.flush()

            result_data[
                "training_id"
            ] = training.id

        main_internship_start_date = (
            _date(
                data.get(
                    "main_internship_start_date"
                )
            )
        )

        if main_internship_start_date:
            main_mentor = (
                resolve_employee_by_name(
                    name=data.get(
                        "main_mentor_name"
                    ),
                    employees_by_name=(
                        employees_by_name
                    ),
                )
            )

            main_internship = MainInternship(
                introductory_process_id=(
                    process.id
                ),
                mentor_id=(
                    main_mentor.id
                    if main_mentor is not None
                    else None
                ),
                mentor_assignment_status=(
                    MentorAssignmentStatus(
                        data[
                            "mentor_assignment_status_value"
                        ]
                    )
                ),
                start_date=(
                    main_internship_start_date
                ),
                end_date=_date(
                    data.get(
                        "main_internship_end_date"
                    )
                ),
            )

            db.add(main_internship)
            db.flush()

            result_data[
                "main_internship_id"
            ] = main_internship.id

        row.result_data = result_data


def _get_process_start_date(
    data: dict[str, Any],
) -> date | None:
    possible_dates = [
        _date(
            data.get(
                "introductory_internship_date"
            )
        ),
        _date(
            data.get("training_date")
        ),
        _date(
            data.get("test_date")
        ),
        _date(
            data.get("hire_date")
        ),
        _date(
            data.get(
                "main_internship_start_date"
            )
        ),
    ]

    existing_dates = [
        value
        for value in possible_dates
        if value is not None
    ]

    if not existing_dates:
        return None

    return min(existing_dates)


def _has_training_data(
    data: dict[str, Any],
) -> bool:
    return any(
        data.get(field) is not None
        for field in (
            "training_date",
            "test_date",
            "test_result",
        )
    )


def create_import_mentor_payments(
    db: Session,
    rows: list[ImportJobRow],
) -> None:
    for row in rows:
        data = row.normalized_data or {}
        result_data = dict(
            row.result_data or {}
        )

        main_internship_id = (
            result_data.get(
                "main_internship_id"
            )
        )

        if main_internship_id is None:
            continue

        if not _has_payment_data(data):
            continue

        payment_is_fully_paid = bool(
            data.get(
                "payment_is_fully_paid"
            )
        )

        actual_amount = _decimal(
            data.get(
                "total_actual_amount"
            )
        )

        if payment_is_fully_paid:
            payment_status = (
                PaymentStatus.PAID
            )
        elif (
            actual_amount is not None
            and actual_amount > 0
        ):
            payment_status = (
                PaymentStatus.APPROVED
            )
        else:
            payment_status = (
                PaymentStatus.PENDING
            )

        payment_created_at = (
            _date(
                data.get(
                    "second_payment_created_at"
                )
            )
            or _date(
                data.get(
                    "first_payment_created_at"
                )
            )
        )

        payment = MentorPayment(
            main_internship_id=(
                main_internship_id
            ),
            planned_amount=_decimal(
                data.get(
                    "total_recommended_amount"
                )
            ),
            internship_form_completed=bool(
                data.get(
                    "internship_form_completed"
                )
            ),
            payment_created_at=(
                payment_created_at
            ),
            registration_method=(
                PaymentRegistrationMethod(
                    data[
                        "payment_registration_method_value"
                    ]
                )
                if data.get(
                    "payment_registration_method_value"
                )
                else None
            ),
            amount=actual_amount,
            payment_status=payment_status,
            paid_at=(
                payment_created_at
                if payment_is_fully_paid
                else None
            ),
            non_payment_reason=(
                NonPaymentReason(
                    data[
                        "non_payment_reason_value"
                    ]
                )
                if data.get(
                    "non_payment_reason_value"
                )
                else None
            ),
        )

        db.add(payment)
        db.flush()

        result_data[
            "mentor_payment_id"
        ] = payment.id

        row.result_data = result_data


def _has_payment_data(
    data: dict[str, Any],
) -> bool:
    return any(
        data.get(field) is not None
        for field in (
            "mentor_payment_expected",
            "internship_form_completed",
            "first_payment_created_at",
            "first_recommended_amount",
            "first_actual_amount",
            "second_payment_created_at",
            "second_recommended_amount",
            "second_actual_amount",
            "total_recommended_amount",
            "total_actual_amount",
            "payment_is_fully_paid",
            "non_payment_reason_value",
            "payment_registration_method_value",
        )
    )


def _decimal(
    value: Any,
) -> Decimal | None:
    if value is None or value == "":
        return None

    return Decimal(str(value))


def create_import_adaptations(
    db: Session,
    rows: list[ImportJobRow],
    employees_by_row_id: dict[
        int,
        Employee,
    ],
) -> None:
    for row in rows:
        data = row.normalized_data or {}
        result_data = dict(
            row.result_data or {}
        )

        introductory_process_id = (
            result_data.get(
                "introductory_process_id"
            )
        )

        if introductory_process_id is None:
            continue

        if not _has_adaptation_data(data):
            continue

        employee = employees_by_row_id[
            row.id
        ]

        position = db.get(
            Position,
            employee.position_id,
        )

        if (
                employee.hire_date is None
                or position is None
        ):
            continue

        policy = (
            get_applicable_adaptation_policy(
                db=db,
                position_category=(
                    position.category
                ),
                reference_date=(
                    employee.hire_date
                ),
            )
        )

        deadline_date = (
            _date(
                data.get(
                    "stage_3_planned_end_date"
                )
            )
            or (
                employee.hire_date
                + timedelta(
                    days=(
                        policy
                        .total_deadline_days
                    )
                )
            )
        )

        stage_3_actual_date = _date(
            data.get(
                "stage_3_actual_date"
            )
        )

        if stage_3_actual_date is not None:
            process_status = (
                AdaptationProcessStatus
                .COMPLETED
            )

            completed_at = datetime.combine(
                stage_3_actual_date,
                time.min,
                tzinfo=timezone.utc,
            )
        else:
            process_status = (
                AdaptationProcessStatus
                .ACTIVE
            )

            completed_at = None

        process = AdaptationProcess(
            introductory_process_id=(
                introductory_process_id
            ),
            policy_id=policy.id,
            deadline_date=deadline_date,
            status=process_status,
            probation_completed_successfully=(
                data.get(
                    "probation_completed_successfully"
                )
            ),
            completed_at=completed_at,
        )

        db.add(process)
        db.flush()

        result_data[
            "adaptation_process_id"
        ] = process.id

        stage_1 = _create_stage_1(
            db=db,
            process=process,
            policy=policy,
            employee=employee,
            data=data,
        )

        stage_2 = _create_stage_2(
            db=db,
            process=process,
            policy=policy,
            previous_stage=stage_1,
            data=data,
        )

        _create_stage_3(
            db=db,
            process=process,
            policy=policy,
            previous_stage=stage_2,
            data=data,
        )

        row.result_data = result_data


def _create_stage_1(
    db: Session,
    process: AdaptationProcess,
    policy,
    employee: Employee,
    data: dict[str, Any],
) -> AdaptationStage:
    planned_start = (
        _date(
            data.get(
                "stage_1_planned_start_date"
            )
        )
        or (
            employee.hire_date
            + timedelta(
                days=(
                    policy
                    .stage_1_start_offset_days
                )
            )
        )
    )

    planned_end = (
        _date(
            data.get(
                "stage_1_planned_end_date"
            )
        )
        or (
            planned_start
            + timedelta(
                days=(
                    policy
                    .stage_1_duration_days
                )
            )
        )
    )

    return _create_stage(
        db=db,
        process=process,
        stage_number=1,
        planned_start=planned_start,
        planned_end=planned_end,
        data=data,
    )


def _create_stage_2(
    db: Session,
    process: AdaptationProcess,
    policy,
    previous_stage: AdaptationStage,
    data: dict[str, Any],
) -> AdaptationStage | None:
    if not _has_stage_data(
        data=data,
        stage_number=2,
    ):
        return None

    planned_start = _date(
        data.get(
            "stage_2_planned_start_date"
        )
    )

    if planned_start is None:
        if previous_stage.actual_date is None:
            return None

        offset_days = (
            policy.stage_2_red_offset_days
            if (
                previous_stage.risk_zone
                == AdaptationRiskZone.RED
            )
            else (
                policy
                .stage_2_normal_offset_days
            )
        )

        planned_start = (
            previous_stage.actual_date
            + timedelta(days=offset_days)
        )

    planned_end = (
        _date(
            data.get(
                "stage_2_planned_end_date"
            )
        )
        or (
            planned_start
            + timedelta(
                days=(
                    policy
                    .stage_2_duration_days
                )
            )
        )
    )

    return _create_stage(
        db=db,
        process=process,
        stage_number=2,
        planned_start=planned_start,
        planned_end=planned_end,
        data=data,
    )


def _create_stage_3(
    db: Session,
    process: AdaptationProcess,
    policy,
    previous_stage: AdaptationStage | None,
    data: dict[str, Any],
) -> AdaptationStage | None:
    if not _has_stage_data(
        data=data,
        stage_number=3,
    ):
        return None

    if (
        previous_stage is None
        or previous_stage.actual_date is None
    ):
        return None

    offset_days = (
        policy.stage_3_red_offset_days
        if (
            previous_stage.risk_zone
            == AdaptationRiskZone.RED
        )
        else (
            policy
            .stage_3_normal_offset_days
        )
    )

    calculated_start = (
        previous_stage.actual_date
        + timedelta(days=offset_days)
    )

    planned_start = min(
        calculated_start,
        process.deadline_date,
    )

    planned_end = (
        _date(
            data.get(
                "stage_3_planned_end_date"
            )
        )
        or process.deadline_date
    )

    return _create_stage(
        db=db,
        process=process,
        stage_number=3,
        planned_start=planned_start,
        planned_end=planned_end,
        data=data,
    )


def _create_stage(
    db: Session,
    process: AdaptationProcess,
    stage_number: int,
    planned_start: date,
    planned_end: date,
    data: dict[str, Any],
) -> AdaptationStage:
    prefix = f"stage_{stage_number}"

    stage = AdaptationStage(
        adaptation_process_id=process.id,
        stage_number=stage_number,
        planned_start_date=planned_start,
        planned_end_date=planned_end,
        actual_date=_date(
            data.get(
                f"{prefix}_actual_date"
            )
        ),
        method=(
            MethodExecutionAdaptation(
                data[
                    f"{prefix}_method_value"
                ]
            )
            if data.get(
                f"{prefix}_method_value"
            )
            else None
        ),
        participants=(
            AdaptationParticipants(
                data[
                    f"{prefix}_participants_value"
                ]
            )
            if data.get(
                f"{prefix}_participants_value"
            )
            else None
        ),
        delay_reason=(
            AdaptationDelayReason(
                data[
                    f"{prefix}_delay_reason_value"
                ]
            )
            if data.get(
                f"{prefix}_delay_reason_value"
            )
            else None
        ),
        risk_zone=(
            AdaptationRiskZone(
                data[
                    f"{prefix}_risk_zone_value"
                ]
            )
            if data.get(
                f"{prefix}_risk_zone_value"
            )
            else None
        ),
        risk_reason=(
            AdaptationRiskReason(
                data[
                    f"{prefix}_risk_reason_value"
                ]
            )
            if data.get(
                f"{prefix}_risk_reason_value"
            )
            else None
        ),
        comment=data.get(
            f"{prefix}_comment"
        ),
    )

    db.add(stage)
    db.flush()

    return stage


def _has_stage_data(
    data: dict[str, Any],
    stage_number: int,
) -> bool:
    prefix = f"stage_{stage_number}"

    return any(
        data.get(field) is not None
        for field in (
            f"{prefix}_planned_start_date",
            f"{prefix}_planned_end_date",
            f"{prefix}_actual_date",
            f"{prefix}_method_value",
            f"{prefix}_participants_value",
            f"{prefix}_delay_reason_value",
            f"{prefix}_risk_zone_value",
            f"{prefix}_risk_reason_value",
            f"{prefix}_comment",
        )
    )


def _has_adaptation_data(
    data: dict[str, Any],
) -> bool:
    return (
        any(
            _has_stage_data(
                data=data,
                stage_number=stage_number,
            )
            for stage_number in (1, 2, 3)
        )
        or data.get(
            "probation_completed_successfully"
        )
        is not None
    )


def execute_onboarding_import(
    db: Session,
    import_job_id: int,
) -> ImportJob:
    import_job = db.get(
        ImportJob,
        import_job_id,
    )

    if import_job is None:
        raise NotFoundError(
            "Import job not found"
        )

    if import_job.status == ImportStatus.COMPLETED:
        raise BusinessRuleError(
            "Import job has already been completed"
        )

    if import_job.status != ImportStatus.READY:
        raise BusinessRuleError(
            "Import job is not ready for execution"
        )

    rows = list(
        db.scalars(
            select(ImportJobRow)
            .where(
                ImportJobRow.import_job_id
                == import_job.id
            )
            .order_by(
                ImportJobRow.excel_row_number
            )
        ).all()
    )

    importable_rows = [
        row
        for row in rows
        if row.status
        in {
            ImportRowStatus.VALID,
            ImportRowStatus.WARNING,
        }
    ]

    error_rows = [
        row
        for row in rows
        if row.status == ImportRowStatus.ERROR
    ]

    if not importable_rows:
        raise BusinessRuleError(
            "Import job has no valid rows"
        )

    import_job.status = ImportStatus.IMPORTING
    import_job.error_message = None

    try:
        for row in error_rows:
            row.status = ImportRowStatus.SKIPPED

        employees_by_row_id = create_import_employees(
            db=db,
            rows=importable_rows,
        )

        employees_by_name = build_employee_name_index(
            employees_by_row_id
        )

        assign_import_managers(
            rows=importable_rows,
            employees_by_row_id=employees_by_row_id,
            employees_by_name=employees_by_name,
        )

        create_import_introductory_data(
            db=db,
            rows=importable_rows,
            employees_by_row_id=employees_by_row_id,
            employees_by_name=employees_by_name,
        )

        create_import_mentor_payments(
            db=db,
            rows=importable_rows,
        )

        create_import_adaptations(
            db=db,
            rows=importable_rows,
            employees_by_row_id=employees_by_row_id,
        )

        for row in importable_rows:
            row.status = ImportRowStatus.IMPORTED

        import_job.imported_rows = len(
            importable_rows
        )
        import_job.status = ImportStatus.COMPLETED
        import_job.completed_at = datetime.now(
            timezone.utc
        )

        db.commit()

    # except IntegrityError as error:
    #     db.rollback()
    #
    #     _mark_import_failed(
    #         db=db,
    #         import_job_id=import_job_id,
    #         error_message=(
    #             "Import data conflicts with existing "
    #             "database records"
    #         ),
    #     )
    #
    #     raise ConflictError(
    #         "Import data conflicts with existing "
    #         "database records"
    #     ) from error

    except IntegrityError as error:
        db.rollback()

        error_message = str(
            error.orig
            if error.orig is not None
            else error
        )

        _mark_import_failed(
            db=db,
            import_job_id=import_job_id,
            error_message=error_message,
        )

        raise ConflictError(
            error_message
        ) from error

    except Exception as error:
        db.rollback()

        _mark_import_failed(
            db=db,
            import_job_id=import_job_id,
            error_message=str(error),
        )

        raise

    db.refresh(import_job)

    return import_job


def _mark_import_failed(
    db: Session,
    import_job_id: int,
    error_message: str,
) -> None:
    import_job = db.get(
        ImportJob,
        import_job_id,
    )

    if import_job is None:
        return

    import_job.status = ImportStatus.FAILED
    import_job.error_message = error_message[:2000]

    db.commit()
