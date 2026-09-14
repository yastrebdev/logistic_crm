from fastapi import Depends, HTTPException, status

from app.api.dependencies.auth import get_current_user
from app.models.user import User


def require_permission(permission_name: str):
    def permission_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        has_permission = any(
            permission.name == permission_name
            for permission in current_user.role.permissions
        )

        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied",
            )

        return current_user

    return permission_checker