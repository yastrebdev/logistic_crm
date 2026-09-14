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
    PositionCreate,
    PositionResponse,
    PositionUpdate,
)
from app.services.organization import (
    position_service as position_service,
)


router = APIRouter(
    prefix="/positions",
    tags=["Positions"],
)


@router.get(
    "",
    response_model=list[PositionResponse],
    status_code=status.HTTP_200_OK,
)
def get_positions(
    division_id: int | None = Query(
        default=None,
        ge=1,
    ),
    _current_user: User = Depends(
        require_permission("organization.read")
    ),
    db: Session = Depends(get_db),
):
    positions = position_service.get_positions(
        db=db,
        division_id=division_id,
    )

    return list(positions)


@router.get(
    "/{position_id}",
    response_model=PositionResponse,
    status_code=status.HTTP_200_OK,
)
def get_position(
    position_id: int,
    _current_user: User = Depends(
        require_permission("organization.read")
    ),
    db: Session = Depends(get_db),
):
    return position_service.get_position(
        db=db,
        position_id=position_id,
    )


@router.post(
    "",
    response_model=PositionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_position(
    data: PositionCreate,
    _current_user: User = Depends(
        require_permission("organization.create")
    ),
    db: Session = Depends(get_db),
):
    return position_service.create_position(
        db=db,
        data=data,
    )


@router.patch(
    "/{position_id}",
    response_model=PositionResponse,
    status_code=status.HTTP_200_OK,
)
def update_position(
    position_id: int,
    data: PositionUpdate,
    _current_user: User = Depends(
        require_permission("organization.update")
    ),
    db: Session = Depends(get_db),
):
    return position_service.update_position(
        db=db,
        position_id=position_id,
        data=data,
    )


@router.delete(
    "/{position_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_position(
    position_id: int,
    _current_user: User = Depends(
        require_permission("organization.delete")
    ),
    db: Session = Depends(get_db),
) -> None:
    position_service.delete_position(
        db=db,
        position_id=position_id,
    )