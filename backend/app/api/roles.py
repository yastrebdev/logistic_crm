from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies.permissions import require_permission
from app.db.database import get_db
from app.models.user import User
from app.schemas.role import RoleResponse, PermissionResponse, RoleUpdate
from app.services import role_service

router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
)


@router.get(
    "",
    response_model=list[RoleResponse],
)
def get_roles(
    _current_user: User = Depends(
        require_permission("roles.read")
    ),
    db: Session = Depends(get_db),
):
    roles = role_service.get_roles(db)

    return roles


@router.get(
    "/permissions",
    response_model=list[PermissionResponse],
)
def get_permissions(
    _current_user: User = Depends(
        require_permission("roles.read")
    ),
    db: Session = Depends(get_db),
):
    permissions = role_service.get_permissions(db)

    return permissions


@router.patch(
    "/{role_id}",
    response_model=RoleResponse,
)
def update_role(
    role_id: int,
    data: RoleUpdate,
    current_user: User = Depends(
        require_permission("roles.update")
    ),
    db: Session = Depends(get_db),
):

    role = role_service.update_role(
        db=db,
        role_id=role_id,
        data=data,
        actor=current_user,
    )

    return role