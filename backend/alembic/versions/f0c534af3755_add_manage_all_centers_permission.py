"""add manage all centers permission

Revision ID: f0c534af3755
Revises: 1cc7f5c0a9c4
Create Date: 2026-09-11 15:06:45.821068

"""

from typing import (
    Sequence,
    Union,
)

from alembic import op
import sqlalchemy as sa


revision: str = "f0c534af3755"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "1cc7f5c0a9c4"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


PERMISSION_NAME = (
    "organization.manage_all_centers"
)


def upgrade() -> None:
    connection = op.get_bind()

    permission_id = connection.scalar(
        sa.text(
            """
            SELECT id
            FROM permissions
            WHERE name = :permission_name
            """
        ),
        {
            "permission_name":
                PERMISSION_NAME,
        },
    )

    if permission_id is None:
        connection.execute(
            sa.text(
                """
                INSERT INTO permissions (name)
                VALUES (:permission_name)
                """
            ),
            {
                "permission_name":
                    PERMISSION_NAME,
            },
        )

        permission_id = connection.scalar(
            sa.text(
                """
                SELECT id
                FROM permissions
                WHERE name = :permission_name
                """
            ),
            {
                "permission_name":
                    PERMISSION_NAME,
            },
        )

    admin_role_id = connection.scalar(
        sa.text(
            """
            SELECT id
            FROM roles
            WHERE name = :role_name
            """
        ),
        {
            "role_name": "admin",
        },
    )

    if (
        admin_role_id is None
        or permission_id is None
    ):
        return

    existing_assignment = connection.scalar(
        sa.text(
            """
            SELECT 1
            FROM role_permissions
            WHERE role_id = :role_id
              AND permission_id = :permission_id
            """
        ),
        {
            "role_id": admin_role_id,
            "permission_id": permission_id,
        },
    )

    if existing_assignment is None:
        connection.execute(
            sa.text(
                """
                INSERT INTO role_permissions (
                    role_id,
                    permission_id
                )
                VALUES (
                    :role_id,
                    :permission_id
                )
                """
            ),
            {
                "role_id": admin_role_id,
                "permission_id":
                    permission_id,
            },
        )


def downgrade() -> None:
    connection = op.get_bind()

    permission_id = connection.scalar(
        sa.text(
            """
            SELECT id
            FROM permissions
            WHERE name = :permission_name
            """
        ),
        {
            "permission_name":
                PERMISSION_NAME,
        },
    )

    if permission_id is None:
        return

    connection.execute(
        sa.text(
            """
            DELETE FROM role_permissions
            WHERE permission_id = :permission_id
            """
        ),
        {
            "permission_id":
                permission_id,
        },
    )

    connection.execute(
        sa.text(
            """
            DELETE FROM permissions
            WHERE id = :permission_id
            """
        ),
        {
            "permission_id":
                permission_id,
        },
    )