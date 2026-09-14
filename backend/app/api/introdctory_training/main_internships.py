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
    MainInternshipCreate,
    MainInternshipResponse,
    MainInternshipUpdate,
)
from app.services import main_internship_service


router = APIRouter(
    prefix="/main-internships",
    tags=["Main internships"],
)


@router.get(
    "",
    response_model=list[MainInternshipResponse],
)
def get_main_internships(
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
        main_internship_service.get_main_internships(
            db=db,
            process_id=process_id,
        )
    )


@router.get(
    "/{internship_id}",
    response_model=MainInternshipResponse,
)
def get_main_internship(
    internship_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.read")
    ),
    db: Session = Depends(get_db),
):
    return main_internship_service.get_main_internship(
        db=db,
        internship_id=internship_id,
    )


@router.post(
    "",
    response_model=MainInternshipResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_main_internship(
    data: MainInternshipCreate,
    _current_user: User = Depends(
        require_permission("onboarding.create")
    ),
    db: Session = Depends(get_db),
):
    return main_internship_service.create_main_internship(
        db=db,
        data=data,
    )


@router.patch(
    "/{internship_id}",
    response_model=MainInternshipResponse,
)
def update_main_internship(
    internship_id: int,
    data: MainInternshipUpdate,
    _current_user: User = Depends(
        require_permission("onboarding.update")
    ),
    db: Session = Depends(get_db),
):
    return main_internship_service.update_main_internship(
        db=db,
        internship_id=internship_id,
        data=data,
    )


@router.delete(
    "/{internship_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_main_internship(
    internship_id: int,
    _current_user: User = Depends(
        require_permission("onboarding.delete")
    ),
    db: Session = Depends(get_db),
) -> None:
    main_internship_service.delete_main_internship(
        db=db,
        internship_id=internship_id,
    )