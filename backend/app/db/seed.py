from sqlalchemy import select

from app.core.security import hash_password
from app.db.database import SessionLocal
from app.core.config import settings
from app.enums.user import UserType
from app.models.rbac import Permission, Role
from app.models.user import User

PERMISSIONS = [
    "users.read",
    "users.create",
    "users.update",
    "users.delete",
    "roles.read",
    "roles.create",
    "roles.update",
    "roles.delete",
    "organization.read",
    "organization.create",
    "organization.update",
    "organization.delete",
    "organization.manage_all_centers",
    "employees.read",
    "employees.create",
    "employees.update",
    "employees.delete",
    "onboarding.read",
    "onboarding.create",
    "onboarding.update",
    "onboarding.delete",
    "notifications.read",
    "notifications.create",
    "notifications.manage",
]


ROLES = {
    "admin": PERMISSIONS,
    "manager": [
        "users.read",
        "roles.read",
        "organization.read",
        "organization.create",
        "organization.update",
        "organization.delete",
        "employees.read",
        "employees.create",
        "employees.update",
        "employees.delete",
        "notifications.read",
        "onboarding.read",
        "onboarding.create",
        "onboarding.update",
        "onboarding.delete",
    ],
    "employee": [
        "organization.read",
        "organization.create",
        "organization.update",
        "employees.read",
        "employees.create",
        "notifications.read",
        "onboarding.read",
        "onboarding.create",
        "onboarding.update",
    ],
}


def seed_roles_and_permissions():
    if (
        settings.seed_admin_email is None
        or settings.seed_admin_password is None
    ):
        raise RuntimeError(
            "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD "
            "must be configured"
        )

    db = SessionLocal()

    try:
        permissions = {}

        for permission_name in PERMISSIONS:
            permission = db.scalar(
                select(Permission).where(
                    Permission.name == permission_name
                )
            )

            if permission is None:
                permission = Permission(
                    name=permission_name
                )
                db.add(permission)

            permissions[permission_name] = permission

        db.flush()

        roles = {}

        for role_name, role_permissions in ROLES.items():
            role = db.scalar(
                select(Role).where(
                    Role.name == role_name
                )
            )

            if role is None:
                role = Role(
                    name=role_name
                )
                db.add(role)

            role.permissions = [
                permissions[permission_name]
                for permission_name in role_permissions
            ]

            roles[role_name] = role

        db.flush()

        admin = db.scalar(
            select(User).where(
                User.email == settings.seed_admin_email
            )
        )

        if admin is None:
            admin = User(
                email=settings.seed_admin_email,
                password_hash=hash_password(settings.seed_admin_password),
                role_id=roles["admin"].id,
                user_type=UserType.HOD,
                is_active=True,
            )

            db.add(admin)

        db.commit()

        print("Seed completed.")
        print(f"Admin email: {settings.seed_admin_email}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_roles_and_permissions()