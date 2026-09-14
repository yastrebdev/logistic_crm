from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.user import User
from app.models.rbac import Role, Permission
from app.exceptions.base import (
    BusinessRuleError,
    NotFoundError,
)
from app.schemas.role import RoleUpdate


def get_roles(
    db: Session,
) -> Sequence[Role]:
    roles = db.scalars(
        select(Role)
        .options(selectinload(Role.permissions))
        .order_by(Role.id)
    ).all()

    return roles


def get_permissions(
    db: Session,
) -> Sequence[Permission]:
    permissions = db.scalars(
        select(Permission)
        .order_by(Permission.name)
    ).all()

    return permissions


def update_role(
    db: Session,
    role_id: int,
    data: RoleUpdate,
    actor: User,
) -> Role:
    role = db.scalar(
        select(Role)
        .options(selectinload(Role.permissions))
        .where(Role.id == role_id)
    )

    if role is None:
        raise NotFoundError("Role not found")

    if role.name == "admin":
        raise BusinessRuleError(
            "Admin role permissions cannot be modified"
        )

    permissions = db.scalars(
        select(Permission).where(
            Permission.id.in_(data.permission_ids)
        )
    ).all()

    found_permission_ids = {
        permission.id
        for permission in permissions
    }

    requested_permission_ids = set(
        data.permission_ids
    )

    missing_permission_ids = (
        requested_permission_ids
        - found_permission_ids
    )

    if missing_permission_ids:
        raise BusinessRuleError(
            "Some permissions do not exist",
            details={
                "permission_ids": sorted(missing_permission_ids),
            },
        )

    if role.id == actor.role_id:
        keeps_roles_update = any(
            permission.name == "roles.update"
            for permission in permissions
        )

        if not keeps_roles_update:
            raise BusinessRuleError(
                "You cannot remove roles.update from your own role"
            )

    role.permissions = list(permissions)
    db.commit()

    return role