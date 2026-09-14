"""link positions to division groups

Revision ID: 3cd38a6b37e5
Revises: 614f8408b18d
Create Date: 2026-09-02 19:22:54.856648

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3cd38a6b37e5'
down_revision: Union[str, Sequence[str], None] = '614f8408b18d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    fk_naming_convention = {
        "fk": (
            "fk_%(table_name)s_%(column_0_name)s_"
            "%(referred_table_name)s"
        ),
    }

    # Добавляем ограничение длины кода РЦ.
    with op.batch_alter_table(
        "distribution_centers",
    ) as batch_op:
        batch_op.create_check_constraint(
            "ck_distribution_centers_code_length",
            "length(code) = 3",
        )

    # Добавляем сотруднику отдельное подразделение.
    with op.batch_alter_table(
        "employees",
        naming_convention=fk_naming_convention,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "division_id",
                sa.Integer(),
                nullable=True,
            )
        )
        batch_op.create_index(
            "ix_employees_division_id",
            ["division_id"],
            unique=False,
        )
        batch_op.create_foreign_key(
            "fk_employees_division_id_divisions",
            "divisions",
            ["division_id"],
            ["id"],
            ondelete="RESTRICT",
        )

    # Сначала добавляем новую колонку как nullable,
    # потому что в positions уже находятся записи.
    op.add_column(
        "positions",
        sa.Column(
            "division_group_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # Переносим группу из текущего подразделения.
    op.execute(
        """
        UPDATE positions
        SET division_group_id = (
            SELECT divisions.division_group_id
            FROM divisions
            WHERE divisions.id = positions.division_id
        )
        """
    )

    # Пересоздаём positions с новой связью.
    with op.batch_alter_table(
        "positions",
        naming_convention=fk_naming_convention,
    ) as batch_op:
        batch_op.drop_index(
            "ix_positions_division_id"
        )
        batch_op.drop_constraint(
            "uq_position_division_name",
            type_="unique",
        )
        batch_op.drop_constraint(
            "fk_positions_division_id_divisions",
            type_="foreignkey",
        )

        batch_op.alter_column(
            "division_group_id",
            existing_type=sa.Integer(),
            nullable=False,
        )

        batch_op.create_index(
            "ix_positions_division_group_id",
            ["division_group_id"],
            unique=False,
        )
        batch_op.create_unique_constraint(
            "uq_position_division_group_name",
            ["division_group_id", "name"],
        )
        batch_op.create_foreign_key(
            "fk_positions_division_group_id_division_groups",
            "division_groups",
            ["division_group_id"],
            ["id"],
            ondelete="RESTRICT",
        )

        batch_op.drop_column("division_id")


def downgrade() -> None:
    fk_naming_convention = {
        "fk": (
            "fk_%(table_name)s_%(column_0_name)s_"
            "%(referred_table_name)s"
        ),
    }

    # Возвращаем division_id сначала как nullable.
    op.add_column(
        "positions",
        sa.Column(
            "division_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # При возврате старой структуры должность необходимо
    # привязать к одному из подразделений своей группы.
    op.execute(
        """
        UPDATE positions
        SET division_id = (
            SELECT MIN(divisions.id)
            FROM divisions
            WHERE divisions.division_group_id
                = positions.division_group_id
        )
        """
    )

    with op.batch_alter_table(
        "positions",
        naming_convention=fk_naming_convention,
    ) as batch_op:
        batch_op.drop_index(
            "ix_positions_division_group_id"
        )
        batch_op.drop_constraint(
            "uq_position_division_group_name",
            type_="unique",
        )
        batch_op.drop_constraint(
            "fk_positions_division_group_id_division_groups",
            type_="foreignkey",
        )

        batch_op.alter_column(
            "division_id",
            existing_type=sa.Integer(),
            nullable=False,
        )

        batch_op.create_index(
            "ix_positions_division_id",
            ["division_id"],
            unique=False,
        )
        batch_op.create_unique_constraint(
            "uq_position_division_name",
            ["division_id", "name"],
        )
        batch_op.create_foreign_key(
            "fk_positions_division_id_divisions",
            "divisions",
            ["division_id"],
            ["id"],
            ondelete="RESTRICT",
        )

        batch_op.drop_column(
            "division_group_id"
        )

    with op.batch_alter_table(
        "employees",
        naming_convention=fk_naming_convention,
    ) as batch_op:
        batch_op.drop_constraint(
            "fk_employees_division_id_divisions",
            type_="foreignkey",
        )
        batch_op.drop_index(
            "ix_employees_division_id"
        )
        batch_op.drop_column(
            "division_id"
        )

    with op.batch_alter_table(
        "distribution_centers",
    ) as batch_op:
        batch_op.drop_constraint(
            "ck_distribution_centers_code_length",
            type_="check",
        )
