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
    IntroProcessCreate,
    IntroProcessDetailResponse,
    IntroProcessResponse,
    IntroProcessUpdate,
)
from app.services import introductory_process_service


router = APIRouter(
    prefix="/introductory-processes",
    tags=["Introductory processes"],
)


@router.get(
    "",
    response_model=list[IntroProcessResponse],
    status_code=status.HTTP_200_OK,
)
def get_introductory_processes(
    employee_id: int | None = Query(
        default=None,
        gt=0,
    ),
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    processes = (
        introductory_process_service
        .get_introductory_processes(
            db=db,
            employee_id=employee_id,
        )
    )

    return list(processes)


@router.get(
    "/{process_id}",
    response_model=IntroProcessResponse,
    status_code=status.HTTP_200_OK,
)
def get_introductory_process(
    process_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return (
        introductory_process_service
        .get_introductory_process(
            db=db,
            process_id=process_id,
        )
    )


@router.post(
    "",
    response_model=IntroProcessResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_introductory_process(
    data: IntroProcessCreate,
    _current_user: User = Depends(
        require_permission("onboarding.create")
    ),
    db: Session = Depends(get_db),
):
    return (
        introductory_process_service
        .create_introductory_process(
            db=db,
            data=data,
        )
    )


@router.patch(
    "/{process_id}",
    response_model=IntroProcessResponse,
    status_code=status.HTTP_200_OK,
)
def update_introductory_process(
    process_id: int,
    data: IntroProcessUpdate,
    _current_user: User = Depends(
        require_permission("onboarding.update")
    ),
    db: Session = Depends(get_db),
):
    return (
        introductory_process_service
        .update_introductory_process(
            db=db,
            process_id=process_id,
            data=data,
        )
    )


@router.delete(
    "/{process_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_introductory_process(
    process_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.delete")
    ),
    db: Session = Depends(get_db),
) -> None:
    introductory_process_service.delete_introductory_process(
        db=db,
        process_id=process_id,
    )


@router.get(
    "/{process_id}/details",
    response_model=IntroProcessDetailResponse,
    status_code=status.HTTP_200_OK,
)
def get_introductory_process_details(
    process_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return (
        introductory_process_service
        .get_introductory_process_details(
            db=db,
            process_id=process_id,
        )
    )