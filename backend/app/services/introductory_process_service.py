from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.exceptions.base import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)
from app.models import (
    Employee,
    IntroductoryInternship,
    IntroductoryProcess,
    User, MainInternship, AdaptationProcess,
)
from app.schemas.introductory_process import (
    IntroductoryInternshipCreate,
    IntroductoryInternshipUpdate,
    IntroProcessCreate,
    IntroProcessUpdate,
)
from app.services.adaptation_service import (
    create_adaptation_for_introductory_process,
)


def get_introductory_processes(
    db: Session,
    employee_id: int | None = None,
) -> Sequence[IntroductoryProcess]:
    query = select(IntroductoryProcess)

    if employee_id is not None:
        query = query.where(
            IntroductoryProcess.employee_id == employee_id
        )

    query = query.order_by(
        IntroductoryProcess.start_date.desc(),
        IntroductoryProcess.id.desc(),
    )

    return db.scalars(query).all()


def get_introductory_process(
    db: Session,
    process_id: int,
) -> IntroductoryProcess:
    process = db.get(
        IntroductoryProcess,
        process_id,
    )

    if process is None:
        raise NotFoundError(
            "Introductory process not found"
        )

    return process


def create_introductory_process(
    db: Session,
    data: IntroProcessCreate,
) -> IntroductoryProcess:
    employee = db.get(
        Employee,
        data.employee_id,
    )

    if employee is None:
        raise NotFoundError(
            "Employee not found"
        )

    tutor = db.get(
        User,
        data.tutor_id,
    )

    if tutor is None:
        raise NotFoundError(
            "Tutor not found"
        )

    if not tutor.is_active:
        raise BusinessRuleError(
            "Inactive user cannot be assigned as tutor"
        )

    if (
        data.end_date is not None
        and data.end_date < data.start_date
    ):
        raise BusinessRuleError(
            "End date cannot be earlier than start date"
        )

    process = IntroductoryProcess(
        employee_id=data.employee_id,
        tutor_id=data.tutor_id,
        start_date=data.start_date,
        end_date=data.end_date,
    )

    db.add(process)

    try:
        db.flush()

        if process.end_date is not None:
            create_adaptation_for_introductory_process(
                db=db,
                introductory_process=process,
            )

        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Introductory process data conflicts "
            "with an existing record"
        ) from None

    db.refresh(process)

    return process


def update_introductory_process(
    db: Session,
    process_id: int,
    data: IntroProcessUpdate,
) -> IntroductoryProcess:
    process = db.get(
        IntroductoryProcess,
        process_id,
    )

    if process is None:
        raise NotFoundError(
            "Introductory process not found"
        )

    was_completed = process.end_date is not None

    update_data = data.model_dump(
        exclude_unset=True,
    )

    if not update_data:
        return process

    existing_adaptation = db.scalar(
        select(AdaptationProcess).where(
            AdaptationProcess.introductory_process_id
            == process.id
        )
    )

    if (
        existing_adaptation is not None
        and "employee_id" in update_data
        and update_data["employee_id"]
        != process.employee_id
    ):
        raise BusinessRuleError(
            "Employee cannot be changed after "
            "adaptation has started"
        )

    target_employee_id = update_data.get(
        "employee_id",
        process.employee_id,
    )
    target_tutor_id = update_data.get(
        "tutor_id",
        process.tutor_id,
    )
    target_start_date = update_data.get(
        "start_date",
        process.start_date,
    )
    target_end_date = update_data.get(
        "end_date",
        process.end_date,
    )

    if target_employee_id != process.employee_id:
        employee = db.get(
            Employee,
            target_employee_id,
        )

        if employee is None:
            raise NotFoundError(
                "Employee not found"
            )

    if target_tutor_id != process.tutor_id:
        tutor = db.get(
            User,
            target_tutor_id,
        )

        if tutor is None:
            raise NotFoundError(
                "Tutor not found"
            )

        if not tutor.is_active:
            raise BusinessRuleError(
                "Inactive user cannot be assigned as tutor"
            )

    if (
        target_end_date is not None
        and target_end_date < target_start_date
    ):
        raise BusinessRuleError(
            "End date cannot be earlier than start date"
        )

    is_completed = target_end_date is not None

    if (
        was_completed
        and not is_completed
        and existing_adaptation is not None
    ):
        raise BusinessRuleError(
            "Completed introductory process cannot be "
            "reopened after adaptation has started"
        )

    try:
        for field, value in update_data.items():
            setattr(process, field, value)

        db.flush()

        if not was_completed and is_completed:
            create_adaptation_for_introductory_process(
                db=db,
                introductory_process=process,
            )

        db.commit()

    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Introductory process data conflicts "
            "with an existing record"
        ) from None

    except (
        BusinessRuleError,
        ConflictError,
        NotFoundError,
    ):
        db.rollback()
        raise

    db.refresh(process)

    return process


def delete_introductory_process(
    db: Session,
    process_id: int,
) -> None:
    process = db.get(
        IntroductoryProcess,
        process_id,
    )

    if process is None:
        raise NotFoundError(
            "Introductory process not found"
        )

    db.delete(process)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Introductory process cannot be deleted "
            "while it contains protected payment data"
        ) from None


def get_introductory_internships(
    db: Session,
    process_id: int | None = None,
) -> Sequence[IntroductoryInternship]:
    query = select(IntroductoryInternship)

    if process_id is not None:
        query = query.where(
            IntroductoryInternship.introductory_process_id
            == process_id
        )

    query = query.order_by(
        IntroductoryInternship.internship_date.desc(),
        IntroductoryInternship.id.desc(),
    )

    return db.scalars(query).all()


def get_introductory_internship(
    db: Session,
    internship_id: int,
) -> IntroductoryInternship:
    internship = db.get(
        IntroductoryInternship,
        internship_id,
    )

    if internship is None:
        raise NotFoundError(
            "Introductory internship not found"
        )

    return internship


def create_introductory_internship(
    db: Session,
    data: IntroductoryInternshipCreate,
) -> IntroductoryInternship:
    process = db.get(
        IntroductoryProcess,
        data.introductory_process_id,
    )

    if process is None:
        raise NotFoundError(
            "Introductory process not found"
        )

    mentor = db.get(
        Employee,
        data.mentor_id,
    )

    if mentor is None:
        raise NotFoundError(
            "Mentor not found"
        )

    if process.employee_id == mentor.id:
        raise BusinessRuleError(
            "Employee cannot be their own mentor"
        )

    if data.internship_date < process.start_date:
        raise BusinessRuleError(
            "Internship date cannot be earlier "
            "than introductory process start date"
        )

    if (
        process.end_date is not None
        and data.internship_date > process.end_date
    ):
        raise BusinessRuleError(
            "Internship date cannot be later "
            "than introductory process end date"
        )

    internship = IntroductoryInternship(
        introductory_process_id=(
            data.introductory_process_id
        ),
        mentor_id=data.mentor_id,
        internship_date=data.internship_date,
    )

    db.add(internship)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Introductory internship data conflicts "
            "with an existing record"
        ) from None

    db.refresh(internship)

    return internship


def update_introductory_internship(
    db: Session,
    internship_id: int,
    data: IntroductoryInternshipUpdate,
) -> IntroductoryInternship:
    internship = db.get(
        IntroductoryInternship,
        internship_id,
    )

    if internship is None:
        raise NotFoundError(
            "Introductory internship not found"
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
    target_internship_date = update_data.get(
        "internship_date",
        internship.internship_date,
    )

    process = db.get(
        IntroductoryProcess,
        target_process_id,
    )

    if process is None:
        raise NotFoundError(
            "Introductory process not found"
        )

    mentor = db.get(
        Employee,
        target_mentor_id,
    )

    if mentor is None:
        raise NotFoundError(
            "Mentor not found"
        )

    if process.employee_id == mentor.id:
        raise BusinessRuleError(
            "Employee cannot be their own mentor"
        )

    if target_internship_date < process.start_date:
        raise BusinessRuleError(
            "Internship date cannot be earlier "
            "than introductory process start date"
        )

    if (
        process.end_date is not None
        and target_internship_date > process.end_date
    ):
        raise BusinessRuleError(
            "Internship date cannot be later "
            "than introductory process end date"
        )

    for field, value in update_data.items():
        setattr(internship, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Introductory internship data conflicts "
            "with an existing record"
        ) from None

    db.refresh(internship)

    return internship


def delete_introductory_internship(
    db: Session,
    internship_id: int,
) -> None:
    internship = db.get(
        IntroductoryInternship,
        internship_id,
    )

    if internship is None:
        raise NotFoundError(
            "Introductory internship not found"
        )

    db.delete(internship)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Introductory internship cannot be deleted"
        ) from None


def get_introductory_process_details(
    db: Session,
    process_id: int,
) -> IntroductoryProcess:
    process = db.scalar(
        select(IntroductoryProcess)
        .options(
            selectinload(
                IntroductoryProcess
                .introductory_internships
            ),
            selectinload(
                IntroductoryProcess.trainings
            ),
            selectinload(
                IntroductoryProcess.main_internships
            ).selectinload(
                MainInternship.mentor_payment
            ),
        )
        .where(
            IntroductoryProcess.id == process_id
        )
    )

    if process is None:
        raise NotFoundError(
            "Introductory process not found"
        )

    return process