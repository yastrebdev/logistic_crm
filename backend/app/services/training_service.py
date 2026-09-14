from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions.base import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)
from app.models import (
    IntroductoryProcess,
    Training,
)
from app.schemas.introductory_process import (
    TrainingCreate,
    TrainingUpdate,
)


def get_trainings(
    db: Session,
    process_id: int | None = None,
) -> Sequence[Training]:
    query = select(Training)

    if process_id is not None:
        query = query.where(
            Training.introductory_process_id
            == process_id
        )

    query = query.order_by(
        Training.training_date.desc(),
        Training.id.desc(),
    )

    return db.scalars(query).all()


def get_training(
    db: Session,
    training_id: int,
) -> Training:
    training = db.get(
        Training,
        training_id,
    )

    if training is None:
        raise NotFoundError(
            "Training not found"
        )

    return training


def validate_training_data(
    process: IntroductoryProcess,
    training_date,
    test_date,
    test_result,
) -> None:
    if (
        test_result is not None
        and test_date is None
    ):
        raise BusinessRuleError(
            "Test date is required when "
            "test result is specified"
        )

    if (
        training_date is not None
        and test_date is not None
        and test_date < training_date
    ):
        raise BusinessRuleError(
            "Test date cannot be earlier "
            "than training date"
        )

    if (
        training_date is not None
        and training_date < process.start_date
    ):
        raise BusinessRuleError(
            "Training date cannot be earlier "
            "than introductory process start date"
        )

    if (
        test_date is not None
        and test_date < process.start_date
    ):
        raise BusinessRuleError(
            "Test date cannot be earlier "
            "than introductory process start date"
        )

    if process.end_date is not None:
        if (
            training_date is not None
            and training_date > process.end_date
        ):
            raise BusinessRuleError(
                "Training date cannot be later "
                "than introductory process end date"
            )

        if (
            test_date is not None
            and test_date > process.end_date
        ):
            raise BusinessRuleError(
                "Test date cannot be later "
                "than introductory process end date"
            )


def create_training(
    db: Session,
    data: TrainingCreate,
) -> Training:
    process = db.get(
        IntroductoryProcess,
        data.introductory_process_id,
    )

    if process is None:
        raise NotFoundError(
            "Introductory process not found"
        )

    validate_training_data(
        process=process,
        training_date=data.training_date,
        test_date=data.test_date,
        test_result=data.test_result,
    )

    training = Training(
        introductory_process_id=(
            data.introductory_process_id
        ),
        training_date=data.training_date,
        admission_format=data.admission_format,
        test_date=data.test_date,
        test_result=data.test_result,
    )

    db.add(training)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Training data conflicts "
            "with an existing record"
        ) from None

    db.refresh(training)

    return training


def update_training(
    db: Session,
    training_id: int,
    data: TrainingUpdate,
) -> Training:
    training = db.get(
        Training,
        training_id,
    )

    if training is None:
        raise NotFoundError(
            "Training not found"
        )

    update_data = data.model_dump(
        exclude_unset=True,
    )

    if not update_data:
        return training

    target_process_id = update_data.get(
        "introductory_process_id",
        training.introductory_process_id,
    )
    target_training_date = update_data.get(
        "training_date",
        training.training_date,
    )
    target_test_date = update_data.get(
        "test_date",
        training.test_date,
    )
    target_test_result = update_data.get(
        "test_result",
        training.test_result,
    )

    process = db.get(
        IntroductoryProcess,
        target_process_id,
    )

    if process is None:
        raise NotFoundError(
            "Introductory process not found"
        )

    validate_training_data(
        process=process,
        training_date=target_training_date,
        test_date=target_test_date,
        test_result=target_test_result,
    )

    for field, value in update_data.items():
        setattr(training, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Training data conflicts "
            "with an existing record"
        ) from None

    db.refresh(training)

    return training


def delete_training(
    db: Session,
    training_id: int,
) -> None:
    training = db.get(
        Training,
        training_id,
    )

    if training is None:
        raise NotFoundError(
            "Training not found"
        )

    db.delete(training)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Training cannot be deleted"
        ) from None