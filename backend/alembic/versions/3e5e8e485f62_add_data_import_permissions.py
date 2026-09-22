"""add data import permissions

Revision ID: 3e5e8e485f62
Revises: c06c07434b77
Create Date: 2026-09-17 12:52:54.259928

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3e5e8e485f62"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "c06c07434b77"

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


PERMISSION_NAMES = (
    "imports.read",
    "imports.create",
    "imports.execute",
)


def upgrade() -> None:
    connection = op.get_bind()

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

    for permission_name in PERMISSION_NAMES:
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
                    permission_name,
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
                        permission_name,
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
                        permission_name,
                },
            )

        if (
            admin_role_id is None
            or permission_id is None
        ):
            continue

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
                "permission_id":
                    permission_id,
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

    for permission_name in PERMISSION_NAMES:
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
                    permission_name,
            },
        )

        if permission_id is None:
            continue

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