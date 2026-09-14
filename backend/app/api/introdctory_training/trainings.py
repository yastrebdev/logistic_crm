from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.permissions import require_permission
from app.db.database import get_db
from app.models import User
from app.schemas.introductory_process import (
    TrainingCreate,
    TrainingResponse,
    TrainingUpdate,
)
from app.services import training_service


router = APIRouter(
    prefix="/trainings",
    tags=["Trainings"],
)


@router.get(
    "",
    response_model=list[TrainingResponse],
)
def get_trainings(
    process_id: int | None = Query(
        default=None,
        gt=0,
    ),
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return list(
        training_service.get_trainings(
            db=db,
            process_id=process_id,
        )
    )


@router.get(
    "/{training_id}",
    response_model=TrainingResponse,
)
def get_training(
    training_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return training_service.get_training(
        db=db,
        training_id=training_id,
    )


@router.post(
    "",
    response_model=TrainingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_training(
    data: TrainingCreate,
    _current_user: User = Depends(
        require_permission("onboarding.create")
    ),
    db: Session = Depends(get_db),
):
    return training_service.create_training(
        db=db,
        data=data,
    )


@router.patch(
    "/{training_id}",
    response_model=TrainingResponse,
)
def update_training(
    training_id: int,
    data: TrainingUpdate,
    _current_user: User = Depends(
        require_permission("onboarding.update")
    ),
    db: Session = Depends(get_db),
):
    return training_service.update_training(
        db=db,
        training_id=training_id,
        data=data,
    )


@router.delete(
    "/{training_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_training(
    training_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.delete")
    ),
    db: Session = Depends(get_db),
) -> None:
    training_service.delete_training(
        db=db,
        training_id=training_id,
    )