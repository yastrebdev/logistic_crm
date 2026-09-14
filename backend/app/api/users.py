from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.api.dependencies.permissions import require_permission
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import (
    CurrentUserResponse,
    UserCreate,
    UserDistributionCenterCreate,
    UserDistributionCenterResponse,
    UserListResponse,
    UserResponse,
    UserUpdate,
)
from app.services import user_service


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "",
    response_model=UserListResponse,
)
def get_users(
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    _current_user: User = Depends(
        require_permission("users.read")
    ),
    db: Session = Depends(get_db),
) -> UserListResponse:
    total, users = user_service.get_users(
        db=db,
        page=page,
        page_size=page_size,
    )

    return UserListResponse(
        items=list(users),
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
)
def get_me(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    center_links = (
        user_service.get_user_distribution_centers(
            db=db,
            user_id=current_user.id,
        )
    )

    return CurrentUserResponse(
        id=current_user.id,
        manager_id=current_user.manager_id,
        email=current_user.email,
        full_name=current_user.full_name,
        user_type=current_user.user_type,
        is_active=current_user.is_active,
        role=current_user.role,
        permissions=[
            permission.name
            for permission in current_user.role.permissions
        ],
        distribution_centers=[
            link.distribution_center
            for link in center_links
        ],
        created_at=current_user.created_at,
    )


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    data: UserCreate,
    _current_user: User = Depends(
        require_permission("users.create")
    ),
    db: Session = Depends(get_db),
) -> UserResponse:
    return user_service.create_user(
        db=db,
        data=data,
    )


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
)
def update_user(
    user_id: int,
    data: UserUpdate,
    current_user: User = Depends(
        require_permission("users.update")
    ),
    db: Session = Depends(get_db),
) -> UserResponse:
    return user_service.update_user(
        db=db,
        user_id=user_id,
        data=data,
        actor=current_user,
    )


@router.get(
    "/{user_id}/distribution-centers",
    response_model=list[
        UserDistributionCenterResponse
    ],
)
def get_user_distribution_centers(
    user_id: int,
    _current_user: User = Depends(
        require_permission("users.read")
    ),
    db: Session = Depends(get_db),
):
    links = (
        user_service.get_user_distribution_centers(
            db=db,
            user_id=user_id,
        )
    )

    return list(links)


@router.post(
    "/{user_id}/distribution-centers",
    response_model=UserDistributionCenterResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_user_distribution_center(
    user_id: int,
    data: UserDistributionCenterCreate,
    _current_user: User = Depends(
        require_permission("users.update")
    ),
    db: Session = Depends(get_db),
):
    return user_service.assign_distribution_center(
        db=db,
        user_id=user_id,
        data=data,
    )


@router.delete(
    (
        "/{user_id}/distribution-centers/"
        "{distribution_center_id}"
    ),
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_user_distribution_center(
    user_id: int,
    distribution_center_id: int,
    _current_user: User = Depends(
        require_permission("users.update")
    ),
    db: Session = Depends(get_db),
) -> None:
    user_service.remove_distribution_center(
        db=db,
        user_id=user_id,
        distribution_center_id=distribution_center_id,
    )

@router.get(
    "/{user_id}/subordinates",
    response_model=list[UserResponse],
    status_code=status.HTTP_200_OK,
)
def get_user_subordinates(
    user_id: int,
    _current_user: User = Depends(
        require_permission("users.read")
    ),
    db: Session = Depends(get_db),
):
    subordinates = user_service.get_subordinates(
        db=db,
        user_id=user_id,
    )

    return list(subordinates)