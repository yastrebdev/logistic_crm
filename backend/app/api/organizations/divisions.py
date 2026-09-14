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
from app.schemas.organization import (
    DivisionCreate,
    DivisionResponse,
    DivisionUpdate,
)
from app.services.organization import (
    division_service as division_service,
)


router = APIRouter(
    prefix="/divisions",
    tags=["Divisions"],
)


@router.get(
    "",
    response_model=list[DivisionResponse],
    status_code=status.HTTP_200_OK,
)
def get_divisions(
    division_group_id: int | None = Query(
        default=None,
        ge=1,
    ),
    _current_user: User = Depends(
        require_permission("organization.read")
    ),
    db: Session = Depends(get_db),
):
    divisions = division_service.get_divisions(
        db=db,
        division_group_id=division_group_id,
    )

    return list(divisions)


@router.get(
    "/{division_id}",
    response_model=DivisionResponse,
    status_code=status.HTTP_200_OK,
)
def get_division(
    division_id: int,
    _current_user: User = Depends(
        require_permission("organization.read")
    ),
    db: Session = Depends(get_db),
):
    return division_service.get_division(
        db=db,
        division_id=division_id,
    )


@router.post(
    "",
    response_model=DivisionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_division(
    data: DivisionCreate,
    current_user: User = Depends(
        require_permission("organization.create")
    ),
    db: Session = Depends(get_db),
):
    return division_service.create_division(
        db=db,
        data=data,
        actor=current_user,
    )


@router.patch(
    "/{division_id}",
    response_model=DivisionResponse,
    status_code=status.HTTP_200_OK,
)
def update_division(
    division_id: int,
    data: DivisionUpdate,
    _current_user: User = Depends(
        require_permission("organization.update")
    ),
    db: Session = Depends(get_db),
):
    return division_service.update_division(
        db=db,
        division_id=division_id,
        data=data,
    )


@router.delete(
    "/{division_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_division(
    division_id: int,
    _current_user: User = Depends(
        require_permission("organization.delete")
    ),
    db: Session = Depends(get_db),
) -> None:
    division_service.delete_division(
        db=db,
        division_id=division_id,
    )