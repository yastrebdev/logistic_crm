from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import (
    Session,
    selectinload,
)

from app.core.security import hash_password
from app.exceptions.base import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)
from app.models.organization import DistributionCenter
from app.models.rbac import Role
from app.models.user import (
    User,
    UserDistributionCenter,
)
from app.schemas.user import (
    UserCreate,
    UserDistributionCenterCreate,
    UserUpdate,
)


def _get_manager(
    db: Session,
    manager_id: int,
) -> User:
    manager = db.get(
        User,
        manager_id,
    )

    if manager is None:
        raise NotFoundError(
            "Manager not found"
        )

    return manager


def _validate_manager_assignment(
    db: Session,
    user_id: int,
    manager_id: int,
) -> None:
    if user_id == manager_id:
        raise BusinessRuleError(
            "A user cannot be their own manager"
        )

    manager = _get_manager(
        db=db,
        manager_id=manager_id,
    )

    visited_user_ids: set[int] = set()
    current_user: User | None = manager

    while current_user is not None:
        if current_user.id == user_id:
            raise BusinessRuleError(
                "Manager assignment would create "
                "a hierarchy cycle"
            )

        if current_user.id in visited_user_ids:
            raise BusinessRuleError(
                "The existing user hierarchy "
                "already contains a cycle"
            )

        visited_user_ids.add(
            current_user.id
        )

        if current_user.manager_id is None:
            break

        current_user = db.get(
            User,
            current_user.manager_id,
        )


def get_users(
    db: Session,
    page: int,
    page_size: int,
) -> tuple[int, Sequence[User]]:
    total = db.scalar(
        select(func.count(User.id))
    ) or 0

    offset = (page - 1) * page_size

    users = db.scalars(
        select(User)
        .options(
            selectinload(User.role)
        )
        .order_by(User.id)
        .offset(offset)
        .limit(page_size)
    ).all()

    return total, users


def create_user(
    db: Session,
    data: UserCreate,
) -> User:
    existing_user = db.scalar(
        select(User)
        .where(
            User.email == data.email
        )
    )

    if existing_user is not None:
        raise ConflictError(
            "User with this email already exists"
        )

    role = db.get(
        Role,
        data.role_id,
    )

    if role is None:
        raise NotFoundError(
            "Role not found"
        )

    if data.manager_id is not None:
        _get_manager(
            db=db,
            manager_id=data.manager_id,
        )

    user = User(
        email=data.email,
        full_name=data.full_name,
        password_hash=hash_password(
            data.password
        ),
        user_type=data.user_type,
        role_id=role.id,
        manager_id=data.manager_id,
        is_active=True,
    )

    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "User data conflicts with an existing record"
        ) from None

    db.refresh(user)

    return user


def update_user(
    db: Session,
    user_id: int,
    data: UserUpdate,
    actor: User,
) -> User:
    user = db.get(
        User,
        user_id,
    )

    if user is None:
        raise NotFoundError(
            "User not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "role_id" in update_data:
        role_id = update_data["role_id"]

        role = db.get(
            Role,
            role_id,
        )

        if role is None:
            raise NotFoundError(
                "Role not found"
            )

        user.role_id = role_id

    if "full_name" in update_data:
        user.full_name = update_data[
            "full_name"
        ]

    if "manager_id" in update_data:
        manager_id = update_data["manager_id"]

        if manager_id is not None:
            _validate_manager_assignment(
                db=db,
                user_id=user.id,
                manager_id=manager_id,
            )

        user.manager_id = manager_id

    if "user_type" in update_data:
        user.user_type = update_data["user_type"]

    if "is_active" in update_data:
        is_active = update_data["is_active"]

        if (
            user.id == actor.id
            and not is_active
        ):
            raise BusinessRuleError(
                "You cannot deactivate yourself"
            )

        user.is_active = is_active

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "User data conflicts with an existing record"
        ) from None

    db.refresh(user)

    return user


def get_subordinates(
    db: Session,
    user_id: int,
) -> Sequence[User]:
    user = db.get(
        User,
        user_id,
    )

    if user is None:
        raise NotFoundError(
            "User not found"
        )

    return db.scalars(
        select(User)
        .where(
            User.manager_id == user_id
        )
        .options(
            selectinload(User.role)
        )
        .order_by(User.email)
    ).all()


def get_user_distribution_centers(
    db: Session,
    user_id: int,
) -> Sequence[UserDistributionCenter]:
    user = db.get(
        User,
        user_id,
    )

    if user is None:
        raise NotFoundError(
            "User not found"
        )

    return db.scalars(
        select(UserDistributionCenter)
        .where(
            UserDistributionCenter.user_id
            == user_id
        )
        .options(
            selectinload(
                UserDistributionCenter.distribution_center
            )
        )
        .order_by(
            UserDistributionCenter.distribution_center_id
        )
    ).all()


def assign_distribution_center(
    db: Session,
    user_id: int,
    data: UserDistributionCenterCreate,
) -> UserDistributionCenter:
    user = db.get(
        User,
        user_id,
    )

    if user is None:
        raise NotFoundError(
            "User not found"
        )

    center = db.get(
        DistributionCenter,
        data.distribution_center_id,
    )

    if center is None:
        raise NotFoundError(
            "Distribution center not found"
        )

    existing_link = db.scalar(
        select(UserDistributionCenter)
        .where(
            UserDistributionCenter.user_id
            == user_id,
            UserDistributionCenter.distribution_center_id
            == data.distribution_center_id,
        )
    )

    if existing_link is not None:
        raise ConflictError(
            "Distribution center is already assigned "
            "to this user"
        )

    link = UserDistributionCenter(
        user_id=user_id,
        distribution_center_id=(
            data.distribution_center_id
        ),
    )

    db.add(link)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ConflictError(
            "Distribution center is already assigned "
            "to this user"
        ) from None

    loaded_link = db.scalar(
        select(UserDistributionCenter)
        .where(
            UserDistributionCenter.id == link.id
        )
        .options(
            selectinload(
                UserDistributionCenter.distribution_center
            )
        )
    )

    if loaded_link is None:
        raise RuntimeError(
            "Created distribution center assignment "
            "could not be loaded"
        )

    return loaded_link


def remove_distribution_center(
    db: Session,
    user_id: int,
    distribution_center_id: int,
) -> None:
    user = db.get(
        User,
        user_id,
    )

    if user is None:
        raise NotFoundError(
            "User not found"
        )

    link = db.scalar(
        select(UserDistributionCenter)
        .where(
            UserDistributionCenter.user_id
            == user_id,
            UserDistributionCenter.distribution_center_id
            == distribution_center_id,
        )
    )

    if link is None:
        raise NotFoundError(
            "Distribution center assignment not found"
        )

    db.delete(link)
    db.commit()