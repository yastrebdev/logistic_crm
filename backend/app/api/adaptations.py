from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from sqlalchemy.orm import Session

from app.api.dependencies.permissions import require_permission
from app.db.database import get_db
from app.models import User
from app.schemas.adaptation import (
    AdaptationProcessDetailResponse,
    AdaptationProcessResponse,
    AdaptationProcessUpdate,
    AdaptationStageResponse,
    AdaptationStageUpdate,
)
from app.services import adaptation_service


router = APIRouter(
    prefix="/adaptations",
    tags=["Adaptations"],
)


@router.get(
    "",
    response_model=list[AdaptationProcessResponse],
)
def get_adaptation_processes(
    introductory_process_id: int | None = Query(
        default=None,
        gt=0,
    ),
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return list(
        adaptation_service.get_adaptation_processes(
            db=db,
            introductory_process_id=(
                introductory_process_id
            ),
        )
    )


@router.get(
    "/stages/{stage_id}",
    response_model=AdaptationStageResponse,
)
def get_adaptation_stage(
    stage_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return adaptation_service.get_adaptation_stage(
        db=db,
        stage_id=stage_id,
    )


@router.patch(
    "/stages/{stage_id}",
    response_model=AdaptationStageResponse,
)
def update_adaptation_stage(
    stage_id: int,
    data: AdaptationStageUpdate,
    _current_user: User = Depends(
        require_permission("onboarding.update")
    ),
    db: Session = Depends(get_db),
):
    return adaptation_service.update_adaptation_stage(
        db=db,
        stage_id=stage_id,
        data=data,
    )


@router.patch(
    "/{adaptation_process_id}",
    response_model=AdaptationProcessResponse,
)
def update_adaptation_process(
    adaptation_process_id: int,
    data: AdaptationProcessUpdate,
    _current_user: User = Depends(
        require_permission(
            "onboarding.update"
        )
    ),
    db: Session = Depends(get_db),
):
    return (
        adaptation_service
        .update_adaptation_process(
            db=db,
            adaptation_process_id=(
                adaptation_process_id
            ),
            data=data,
        )
    )


@router.get(
    "/{adaptation_process_id}",
    response_model=AdaptationProcessDetailResponse,
)
def get_adaptation_process_details(
    adaptation_process_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return (
        adaptation_service
        .get_adaptation_process_details(
            db=db,
            adaptation_process_id=(
                adaptation_process_id
            ),
        )
    )