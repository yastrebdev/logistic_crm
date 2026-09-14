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
    DistributionCenterCreate,
    DistributionCenterDivisionCreate,
    DistributionCenterDivisionDetailResponse,
    DistributionCenterDivisionResponse,
    DistributionCenterResponse,
    DistributionCenterStructureResponse,
    DistributionCenterUpdate,
)
from app.services.organization import (
    distribution_center_service,
)


router = APIRouter(
    prefix="/distribution_centers",
    tags=["Distribution centers"],
)


@router.get(
    "",
    response_model=list[DistributionCenterResponse],
    status_code=status.HTTP_200_OK,
)
def get_centers(
    _current_user: User = Depends(
        require_permission("organization.read")
    ),
    db: Session = Depends(get_db),
):
    centers = distribution_center_service.get_centers(
        db=db,
    )

    return list(centers)


@router.post(
    "",
    response_model=DistributionCenterResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_center(
    data: DistributionCenterCreate,
    _current_user: User = Depends(
        require_permission("organization.create")
    ),
    db: Session = Depends(get_db),
):
    return distribution_center_service.create_center(
        db=db,
        data=data,
    )


@router.get(
    "/{center_id}/divisions",
    response_model=list[
        DistributionCenterDivisionDetailResponse
    ],
    status_code=status.HTTP_200_OK,
)
def get_center_divisions(
    center_id: int,
    _current_user: User = Depends(
        require_permission("organization.read")
    ),
    db: Session = Depends(get_db),
):
    center_divisions = (
        distribution_center_service.get_center_divisions(
            db=db,
            center_id=center_id,
        )
    )

    return list(center_divisions)


@router.post(
    "/{center_id}/divisions",
    response_model=DistributionCenterDivisionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_center_division(
    center_id: int,
    data: DistributionCenterDivisionCreate,
    current_user: User = Depends(
        require_permission(
            "organization.update"
        )
    ),
    db: Session = Depends(get_db),
):
    return (
        distribution_center_service
        .create_center_division(
            db=db,
            center_id=center_id,
            data=data,
            actor=current_user,
        )
    )


@router.delete(
    "/{center_id}/divisions/{center_division_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_center_division(
    center_id: int,
    center_division_id: int,
    current_user: User = Depends(
        require_permission(
            "organization.update"
        )
    ),
    db: Session = Depends(get_db),
) -> None:
    distribution_center_service.delete_center_division(
        db=db,
        center_id=center_id,
        center_division_id=(
            center_division_id
        ),
        actor=current_user,
    )


@router.get(
    "/{center_id}/structure",
    response_model=DistributionCenterStructureResponse,
    status_code=status.HTTP_200_OK,
)
def get_center_structure(
    center_id: int,
    _current_user: User = Depends(
        require_permission("organization.read")
    ),
    db: Session = Depends(get_db),
):
    return distribution_center_service.get_center_structure(
        db=db,
        center_id=center_id,
    )


@router.get(
    "/{center_id}",
    response_model=DistributionCenterResponse,
    status_code=status.HTTP_200_OK,
)
def get_center(
    center_id: int,
    _current_user: User = Depends(
        require_permission("organization.read")
    ),
    db: Session = Depends(get_db),
):
    return distribution_center_service.get_center(
        db=db,
        center_id=center_id,
    )


@router.patch(
    "/{center_id}",
    response_model=DistributionCenterResponse,
    status_code=status.HTTP_200_OK,
)
def patch_center(
    center_id: int,
    data: DistributionCenterUpdate,
    _current_user: User = Depends(
        require_permission("organization.update")
    ),
    db: Session = Depends(get_db),
):
    return distribution_center_service.update_center(
        db=db,
        center_id=center_id,
        data=data,
    )


@router.delete(
    "/{center_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_center(
    center_id: int,
    _current_user: User = Depends(
        require_permission("organization.delete")
    ),
    db: Session = Depends(get_db),
) -> None:
    distribution_center_service.delete_center(
        db=db,
        center_id=center_id,
    )