"""rework organization structure

Revision ID: a7bc161be4f3
Revises: 3cd38a6b37e5
Create Date: 2026-09-04 12:35:15.826395
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a7bc161be4f3"
down_revision: Union[str, Sequence[str], None] = "3cd38a6b37e5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


FK_NAMING_CONVENTION = {
    "fk": (
        "fk_%(table_name)s_%(column_0_name)s_"
        "%(referred_table_name)s"
    ),
}


def upgrade() -> None:
    connection = op.get_bind()

    # Проверяем, что для каждой старой группы существует
    # хотя бы одно подразделение. Оно станет основой для
    # глобального подразделения.
    groups_without_divisions = connection.execute(
        sa.text(
            """
            SELECT division_groups.id
            FROM division_groups
            LEFT JOIN divisions
                ON divisions.division_group_id
                    = division_groups.id
            WHERE divisions.id IS NULL
            """
        )
    ).fetchall()

    if groups_without_divisions:
        group_ids = [
            row[0]
            for row in groups_without_divisions
        ]

        raise RuntimeError(
            "Cannot migrate division groups without divisions. "
            f"Division group IDs: {group_ids}"
        )

    # Проверяем повторяющиеся названия конкретных
    # подразделений внутри одного РЦ.
    duplicate_center_division_names = connection.execute(
        sa.text(
            """
            SELECT
                division_groups.distribution_center_id,
                divisions.name,
                COUNT(*)
            FROM divisions
            JOIN division_groups
                ON division_groups.id
                    = divisions.division_group_id
            GROUP BY
                division_groups.distribution_center_id,
                divisions.name
            HAVING COUNT(*) > 1
            """
        )
    ).fetchall()

    if duplicate_center_division_names:
        raise RuntimeError(
            "Cannot migrate duplicate division names "
            "inside the same distribution center"
        )

    # Если одинаковые должности объединяются,
    # их категории должны совпадать.
    conflicting_position_categories = connection.execute(
        sa.text(
            """
            SELECT
                division_groups.code,
                positions.name,
                COUNT(DISTINCT positions.category)
            FROM positions
            JOIN division_groups
                ON division_groups.id
                    = positions.division_group_id
            GROUP BY
                division_groups.code,
                positions.name
            HAVING COUNT(DISTINCT positions.category) > 1
            """
        )
    ).fetchall()

    if conflicting_position_categories:
        raise RuntimeError(
            "Cannot merge positions with the same name "
            "and different categories"
        )

    # Создаём конкретные подразделения распределительных
    # центров. Старые divisions пока ещё существуют и
    # используются для переноса данных.
    op.create_table(
        "distribution_center_divisions",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "distribution_center_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "division_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=150),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["distribution_center_id"],
            ["distribution_centers.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["division_id"],
            ["divisions.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "distribution_center_id",
            "name",
            name="uq_distribution_center_division_name",
        ),
    )

    op.create_index(
        "ix_distribution_center_divisions_distribution_center_id",
        "distribution_center_divisions",
        ["distribution_center_id"],
        unique=False,
    )

    op.create_index(
        "ix_distribution_center_divisions_division_id",
        "distribution_center_divisions",
        ["division_id"],
        unique=False,
    )

    # Для каждой группы с одинаковым code выбираем одно
    # глобальное подразделение — старое подразделение
    # с минимальным ID.
    #
    # ID конкретного подразделения РЦ сохраняем равным
    # старому divisions.id. Благодаря этому старые
    # employee.division_id можно безопасно перенести.
    connection.execute(
        sa.text(
            """
            INSERT INTO distribution_center_divisions (
                id,
                distribution_center_id,
                division_id,
                name
            )
            SELECT
                old_division.id,
                old_group.distribution_center_id,
                (
                    SELECT MIN(candidate_division.id)
                    FROM divisions AS candidate_division
                    JOIN division_groups AS candidate_group
                        ON candidate_group.id
                            = candidate_division.division_group_id
                    WHERE candidate_group.code = old_group.code
                ),
                old_division.name
            FROM divisions AS old_division
            JOIN division_groups AS old_group
                ON old_group.id
                    = old_division.division_group_id
            """
        )
    )

    # Добавляем сотрудникам ссылку на конкретное
    # подразделение РЦ.
    with op.batch_alter_table(
        "employees",
        naming_convention=FK_NAMING_CONVENTION,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "distribution_center_division_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.create_index(
            "ix_employees_distribution_center_division_id",
            ["distribution_center_division_id"],
            unique=False,
        )

        batch_op.create_foreign_key(
            (
                "fk_employees_"
                "distribution_center_division_id_"
                "distribution_center_divisions"
            ),
            "distribution_center_divisions",
            ["distribution_center_division_id"],
            ["id"],
            ondelete="RESTRICT",
        )

    # IDs новых строк связи совпадают со старыми
    # divisions.id.
    connection.execute(
        sa.text(
            """
            UPDATE employees
            SET distribution_center_division_id = division_id
            WHERE division_id IS NOT NULL
            """
        )
    )

    # Удаляем старую прямую связь сотрудника
    # с глобальным divisions.
    with op.batch_alter_table(
        "employees",
        naming_convention=FK_NAMING_CONVENTION,
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

    # Добавляем должности новую ссылку на глобальное
    # подразделение. Сначала nullable — данные ещё
    # не перенесены.
    with op.batch_alter_table(
        "positions",
        naming_convention=FK_NAMING_CONVENTION,
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "division_id",
                sa.Integer(),
                nullable=True,
            )
        )

        batch_op.create_foreign_key(
            "fk_positions_division_id_divisions",
            "divisions",
            ["division_id"],
            ["id"],
            ondelete="RESTRICT",
        )

    # Каждую должность связываем с глобальным
    # подразделением соответствующей группы.
    connection.execute(
        sa.text(
            """
            UPDATE positions
            SET division_id = (
                SELECT MIN(candidate_division.id)
                FROM divisions AS candidate_division
                JOIN division_groups AS candidate_group
                    ON candidate_group.id
                        = candidate_division.division_group_id
                WHERE candidate_group.code = (
                    SELECT current_group.code
                    FROM division_groups AS current_group
                    WHERE current_group.id
                        = positions.division_group_id
                )
            )
            """
        )
    )

    # Если одинаковые группы существовали в разных РЦ,
    # одинаковые должности могли быть продублированы.
    # Сотрудников переводим на должность с минимальным ID.
    connection.execute(
        sa.text(
            """
            UPDATE employees
            SET position_id = (
                SELECT MIN(candidate_position.id)
                FROM positions AS candidate_position
                WHERE candidate_position.division_id = (
                    SELECT current_position.division_id
                    FROM positions AS current_position
                    WHERE current_position.id
                        = employees.position_id
                )
                AND candidate_position.name = (
                    SELECT current_position.name
                    FROM positions AS current_position
                    WHERE current_position.id
                        = employees.position_id
                )
            )
            WHERE position_id IS NOT NULL
            """
        )
    )

    # Удаляем повторяющиеся должности после переноса
    # ссылок сотрудников.
    connection.execute(
        sa.text(
            """
            DELETE FROM positions
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM positions
                GROUP BY division_id, name
            )
            """
        )
    )

    # Завершаем изменение positions:
    # убираем division_group_id и делаем division_id
    # обязательным.
    with op.batch_alter_table(
        "positions",
        naming_convention=FK_NAMING_CONVENTION,
    ) as batch_op:
        batch_op.drop_constraint(
            (
                "fk_positions_division_group_id_"
                "division_groups"
            ),
            type_="foreignkey",
        )

        batch_op.drop_constraint(
            "uq_position_division_group_name",
            type_="unique",
        )

        batch_op.drop_index(
            "ix_positions_division_group_id"
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

        batch_op.drop_column(
            "division_group_id"
        )

    # Удаляем старые divisions со сменами.
    # В каждой группе с одинаковым code оставляем
    # только строку с минимальным divisions.id.
    connection.execute(
        sa.text(
            """
            DELETE FROM divisions
            WHERE id NOT IN (
                SELECT MIN(candidate_division.id)
                FROM divisions AS candidate_division
                JOIN division_groups AS candidate_group
                    ON candidate_group.id
                        = candidate_division.division_group_id
                GROUP BY candidate_group.code
            )
            """
        )
    )

    # Оставшиеся divisions превращаем в глобальные.
    # Группа выбирается по минимальному ID среди групп
    # с одинаковым code, а название берётся из неё.
    connection.execute(
        sa.text(
            """
            UPDATE divisions
            SET
                division_group_id = (
                    SELECT MIN(candidate_group.id)
                    FROM division_groups AS candidate_group
                    WHERE candidate_group.code = (
                        SELECT current_group.code
                        FROM division_groups AS current_group
                        WHERE current_group.id
                            = divisions.division_group_id
                    )
                ),
                name = (
                    SELECT canonical_group.name
                    FROM division_groups AS canonical_group
                    WHERE canonical_group.id = (
                        SELECT MIN(candidate_group.id)
                        FROM division_groups AS candidate_group
                        WHERE candidate_group.code = (
                            SELECT current_group.code
                            FROM division_groups AS current_group
                            WHERE current_group.id
                                = divisions.division_group_id
                        )
                    )
                )
            """
        )
    )

    # После переноса подразделений оставляем только одну
    # глобальную группу для каждого code.
    connection.execute(
        sa.text(
            """
            DELETE FROM division_groups
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM division_groups
                GROUP BY code
            )
            """
        )
    )

    # Убираем связь группы с РЦ и устанавливаем
    # глобальную уникальность code.
    with op.batch_alter_table(
        "division_groups",
        naming_convention=FK_NAMING_CONVENTION,
    ) as batch_op:
        batch_op.drop_constraint(
            (
                "fk_division_groups_"
                "distribution_center_id_"
                "distribution_centers"
            ),
            type_="foreignkey",
        )

        batch_op.drop_constraint(
            "uq_division_group_dc_code",
            type_="unique",
        )

        batch_op.drop_index(
            "ix_division_groups_distribution_center_id"
        )

        batch_op.create_unique_constraint(
            "uq_division_groups_code",
            ["code"],
        )

        batch_op.drop_column(
            "distribution_center_id"
        )


def downgrade() -> None:
    raise RuntimeError(
        "This migration merges organization reference data "
        "and cannot be downgraded automatically. Restore the "
        "database backup if rollback is required."
    )