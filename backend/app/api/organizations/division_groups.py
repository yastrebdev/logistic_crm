from fastapi import (
    APIRouter,
    Depends,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.permissions import require_permission
from app.db.database import get_db
from app.models import User
from app.schemas.organization import (
    DivisionGroupCreate,
    DivisionGroupResponse,
    DivisionGroupUpdate,
)
from app.services.organization import division_group_service


router = APIRouter(
    prefix="/division_groups",
    tags=["Division Groups"],
)


@router.get(
    "",
    response_model=list[DivisionGroupResponse],
    status_code=status.HTTP_200_OK,
)
def get_division_groups(
    _current_user: User = Depends(
        require_permission("organization.read")
    ),
    db: Session = Depends(get_db),
):
    groups = division_group_service.get_groups(
        db=db,
    )

    return list(groups)


@router.get(
    "/{group_id}",
    response_model=DivisionGroupResponse,
    status_code=status.HTTP_200_OK,
)
def get_division_group(
    group_id: int,
    _current_user: User = Depends(
        require_permission("organization.read")
    ),
    db: Session = Depends(get_db),
):
    return division_group_service.get_group(
        db=db,
        group_id=group_id,
    )


@router.post(
    "",
    response_model=DivisionGroupResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_division_group(
    data: DivisionGroupCreate,
    _current_user: User = Depends(
        require_permission("organization.create")
    ),
    db: Session = Depends(get_db),
):
    return division_group_service.create_group(
        db=db,
        data=data,
    )


@router.patch(
    "/{group_id}",
    response_model=DivisionGroupResponse,
    status_code=status.HTTP_200_OK,
)
def update_division_group(
    group_id: int,
    data: DivisionGroupUpdate,
    _current_user: User = Depends(
        require_permission("organization.update")
    ),
    db: Session = Depends(get_db),
):
    return division_group_service.update_group(
        db=db,
        group_id=group_id,
        data=data,
    )


@router.delete(
    "/{group_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_division_group(
    group_id: int,
    _current_user: User = Depends(
        require_permission("organization.delete")
    ),
    db: Session = Depends(get_db),
) -> None:
    division_group_service.delete_group(
        db=db,
        group_id=group_id,
    )