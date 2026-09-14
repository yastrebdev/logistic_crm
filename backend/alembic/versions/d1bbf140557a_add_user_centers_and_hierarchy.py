"""add user centers and hierarchy

Revision ID: d1bbf140557a
Revises: a7bc161be4f3
Create Date: 2026-09-07 09:36:01.586105
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d1bbf140557a"
down_revision: Union[str, Sequence[str], None] = "a7bc161be4f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


FK_NAMING_CONVENTION = {
    "fk": (
        "fk_%(table_name)s_%(column_0_name)s_"
        "%(referred_table_name)s"
    ),
}


def upgrade() -> None:
    # Сначала добавляем self-связь пользователей.
    #
    # SQLite не поддерживает обычный ALTER TABLE
    # для добавления внешнего ключа, поэтому используем
    # batch mode.
    with op.batch_alter_table(
        "users",
        naming_convention=FK_NAMING_CONVENTION,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "manager_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.create_index(
            "ix_users_manager_id",
            ["manager_id"],
            unique=False,
        )

        batch_op.create_foreign_key(
            "fk_users_manager_id_users",
            "users",
            ["manager_id"],
            ["id"],
            ondelete="SET NULL",
        )

    # После изменения users создаём таблицу назначения
    # пользователей на распределительные центры.
    op.create_table(
        "user_distribution_centers",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "distribution_center_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=(
                "fk_user_distribution_centers_"
                "user_id_users"
            ),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["distribution_center_id"],
            ["distribution_centers.id"],
            name=(
                "fk_user_distribution_centers_"
                "distribution_center_id_"
                "distribution_centers"
            ),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "distribution_center_id",
            name="uq_user_distribution_center",
        ),
    )

    op.create_index(
        (
            "ix_user_distribution_centers_"
            "user_id"
        ),
        "user_distribution_centers",
        ["user_id"],
        unique=False,
    )

    op.create_index(
        (
            "ix_user_distribution_centers_"
            "distribution_center_id"
        ),
        "user_distribution_centers",
        ["distribution_center_id"],
        unique=False,
    )


def downgrade() -> None:
    # Сначала удаляем таблицу, которая ссылается
    # на users и distribution_centers.
    op.drop_index(
        (
            "ix_user_distribution_centers_"
            "distribution_center_id"
        ),
        table_name="user_distribution_centers",
    )

    op.drop_index(
        (
            "ix_user_distribution_centers_"
            "user_id"
        ),
        table_name="user_distribution_centers",
    )

    op.drop_table(
        "user_distribution_centers"
    )

    # Затем убираем self-связь users.
    with op.batch_alter_table(
        "users",
        naming_convention=FK_NAMING_CONVENTION,
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_users_manager_id_users",
            type_="foreignkey",
        )

        batch_op.drop_index(
            "ix_users_manager_id"
        )

        batch_op.drop_column(
            "manager_id"
        )