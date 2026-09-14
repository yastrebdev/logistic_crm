from collections.abc import Sequence
from datetime import date

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.enums.introductory_training import (
    MentorAssignmentStatus,
)
from app.exceptions.base import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)
from app.models import (
    Employee,
    IntroductoryProcess,
    MainInternship,
)
from app.schemas.introductory_process import (
    MainInternshipCreate,
    MainInternshipUpdate,
)
from app.services.internship_policy_service import (
    get_effective_internship_policy,
)


def get_main_internships(
    db: Session,
    process_id: int | None = None,
) -> Sequence[MainInternship]:
    query = select(MainInternship)

    if process_id is not None:
        query = query.where(
            MainInternship.introductory_process_id
            == process_id
        )

    query = query.order_by(
        MainInternship.start_date.desc(),
        MainInternship.id.desc(),
    )

    return db.scalars(query).all()


def get_main_internship(
    db: Session,
    internship_id: int,
) -> MainInternship:
    internship = db.get(
        MainInternship,
        internship_id,
    )

    if internship is None:
        raise NotFoundError(
            "Main internship not found"
        )

    return internship


def validate_main_internship_data(
    db: Session,
    process: IntroductoryProcess,
    mentor_id: int | None,
    mentor_assignment_status: MentorAssignmentStatus,
    start_date: date,
    end_date: date | None,
) -> None:
    if end_date is not None and end_date < start_date:
        raise BusinessRuleError(
            "End date cannot be earlier than start date"
        )

    if start_date < process.start_date:
        raise BusinessRuleError(
            "Main internship cannot start earlier "
            "than introductory process"
        )

    if (
        process.end_date is not None
        and end_date is not None
        and end_date > process.end_date
    ):
        raise BusinessRuleError(
            "Main internship cannot end later "
            "than introductory process"
        )

    if (
        process.end_date is not None
        and start_date > process.end_date
    ):
        raise BusinessRuleError(
            "Main internship cannot start later "
            "than introductory process end date"
        )

    mentor_is_assigned = (
        mentor_assignment_status
        == MentorAssignmentStatus.MENTOR_ASSIGNED
    )

    if mentor_is_assigned and mentor_id is None:
        raise BusinessRuleError(
            "Mentor is required when mentor status "
            "is assigned"
        )

    if not mentor_is_assigned and mentor_id is not None:
        raise BusinessRuleError(
            "Mentor can only be specified when mentor "
            "status is assigned"
        )

    if mentor_id is not None:
        mentor = db.get(
            Employee,
            mentor_id,
        )

        if mentor is None:
            raise NotFoundError(
                "Mentor not found"
            )

        if mentor.id == process.employee_id:
            raise BusinessRuleError(
                "Employee cannot be their own mentor"
            )


def create_main_internship(
    db: Session,
    data: MainInternshipCreate,
) -> MainInternship:
    process = db.get(
        IntroductoryProcess,
        data.introductory_process_id,
    )

    if process is None:
        raise NotFoundError(
            "Introductory process not found"
        )

    employee = db.get(
        Employee,
        process.employee_id,
    )

    if employee is None:
        raise NotFoundError(
            "Employee not found"
        )

    if employee.position_id is None:
        raise BusinessRuleError(
            "Employee must have a position "
            "before creating a main internship"
        )

    if employee.hire_date is None:
        raise BusinessRuleError(
            "Employee must have a hire date "
            "before creating a main internship"
        )

    policy = get_effective_internship_policy(
        db=db,
        position_id=employee.position_id,
        effective_date=employee.hire_date,
    )

    validate_main_internship_data(
        db=db,
        process=process,
        mentor_id=data.mentor_id,
        mentor_assignment_status=(
            data.mentor_assignment_status
        ),
        start_date=data.start_date,
        end_date=data.end_date,
    )

    internship = MainInternship(
        introductory_process_id=(
            data.introductory_process_id
        ),
        internship_policy_id=policy.id,
        mentor_id=data.mentor_id,
        mentor_assignment_status=(
            data.mentor_assignment_status
        ),
        start_date=data.start_date,
        end_date=data.end_date,
    )

    db.add(internship)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise ConflictError(
            "Main internship data conflicts "
            "with an existing record"
        ) from None

    db.refresh(internship)

    return internship


def update_main_internship(
    db: Session,
    internship_id: int,
    data: MainInternshipUpdate,
) -> MainInternship:
    internship = db.get(
        MainInternship,
        internship_id,
    )

    if internship is None:
        raise NotFoundError(
            "Main internship not found"
        )

    update_data = data.model_dump(
        exclude_unset=True,
    )

    if not update_data:
        return internship

    target_process_id = update_data.get(
        "introductory_process_id",
        internship.introductory_process_id,
    )
    target_mentor_id = update_data.get(
        "mentor_id",
        internship.mentor_id,
    )
    target_status = update_data.get(
        "mentor_assignment_status",
        internship.mentor_assignment_status,
    )
    target_start_date = update_data.get(
        "start_date",
        internship.start_date,
    )
    target_end_date = update_data.get(
        "end_date",
        internship.end_date,
    )

    process = db.get(
        IntroductoryProcess,
        target_process_id,
    )

    if process is None:
        raise NotFoundError(
            "Introductory process not found"
        )

    validate_main_internship_data(
        db=db,
        process=process,
        mentor_id=target_mentor_id,
        mentor_assignment_status=target_status,
        start_date=target_start_date,
        end_date=target_end_date,
    )

    for field, value in update_data.items():
        setattr(internship, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Main internship data conflicts "
            "with an existing record"
        ) from None

    db.refresh(internship)

    return internship


def delete_main_internship(
    db: Session,
    internship_id: int,
) -> None:
    internship = db.get(
        MainInternship,
        internship_id,
    )

    if internship is None:
        raise NotFoundError(
            "Main internship not found"
        )

    if internship.mentor_payment is not None:
        raise ConflictError(
            "Main internship cannot be deleted "
            "because it has mentor payment data"
        )

    db.delete(internship)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Main internship cannot be deleted"
        ) from None