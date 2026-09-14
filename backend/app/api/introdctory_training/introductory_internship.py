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
    IntroductoryInternshipCreate,
    IntroductoryInternshipResponse,
    IntroductoryInternshipUpdate,
)
from app.services import introductory_process_service


router = APIRouter(
    prefix="/introductory-internships",
    tags=["Introductory internships"],
)


@router.get(
    "",
    response_model=list[
        IntroductoryInternshipResponse
    ],
    status_code=status.HTTP_200_OK,
)
def get_introductory_internships(
    process_id: int | None = Query(
        default=None,
        gt=0,
    ),
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    internships = (
        introductory_process_service
        .get_introductory_internships(
            db=db,
            process_id=process_id,
        )
    )

    return list(internships)


@router.get(
    "/{internship_id}",
    response_model=IntroductoryInternshipResponse,
    status_code=status.HTTP_200_OK,
)
def get_introductory_internship(
    internship_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return (
        introductory_process_service
        .get_introductory_internship(
            db=db,
            internship_id=internship_id,
        )
    )


@router.post(
    "",
    response_model=IntroductoryInternshipResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_introductory_internship(
    data: IntroductoryInternshipCreate,
    _current_user: User = Depends(
        require_permission("onboarding.create")
    ),
    db: Session = Depends(get_db),
):
    return (
        introductory_process_service
        .create_introductory_internship(
            db=db,
            data=data,
        )
    )


@router.patch(
    "/{internship_id}",
    response_model=IntroductoryInternshipResponse,
    status_code=status.HTTP_200_OK,
)
def update_introductory_internship(
    internship_id: int,
    data: IntroductoryInternshipUpdate,
    _current_user: User = Depends(
        require_permission("onboarding.update")
    ),
    db: Session = Depends(get_db),
):
    return (
        introductory_process_service
        .update_introductory_internship(
            db=db,
            internship_id=internship_id,
            data=data,
        )
    )


@router.delete(
    "/{internship_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_introductory_internship(
    internship_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.delete")
    ),
    db: Session = Depends(get_db),
) -> None:
    (
        introductory_process_service
        .delete_introductory_internship(
            db=db,
            internship_id=internship_id,
        )
    )