"""update introductory process models

Revision ID: 47dfaa9d371b
Revises: 234fe4dd3e75
Create Date: 2026-09-09 15:12:05.144046
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "47dfaa9d371b"
down_revision: Union[str, Sequence[str], None] = (
    "234fe4dd3e75"
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ограничение дат родительского процесса
    with op.batch_alter_table(
        "introductory_process"
    ) as batch_op:
        batch_op.create_check_constraint(
            "ck_introductory_process_dates",
            "end_date IS NULL OR end_date >= start_date",
        )

    # Переименование FK вводной стажировки
    op.drop_index(
        (
            "ix_introductory_internships_"
            "introductory_training_id"
        ),
        table_name="introductory_internships",
    )

    op.execute(
        "ALTER TABLE introductory_internships "
        "RENAME COLUMN introductory_training_id "
        "TO introductory_process_id"
    )

    op.create_index(
        (
            "ix_introductory_internships_"
            "introductory_process_id"
        ),
        "introductory_internships",
        ["introductory_process_id"],
        unique=False,
    )

    # Переименование FK основной стажировки
    op.drop_index(
        "ix_main_internships_introductory_training_id",
        table_name="main_internships",
    )

    op.execute(
        "ALTER TABLE main_internships "
        "RENAME COLUMN introductory_training_id "
        "TO introductory_process_id"
    )

    op.create_index(
        "ix_main_internships_introductory_process_id",
        "main_internships",
        ["introductory_process_id"],
        unique=False,
    )

    # Ограничение дат основной стажировки
    with op.batch_alter_table(
        "main_internships"
    ) as batch_op:
        batch_op.create_check_constraint(
            "ck_main_internship_dates",
            "end_date IS NULL OR end_date >= start_date",
        )

    # Переименование FK обучения
    op.drop_index(
        "ix_trainings_introductory_training_id",
        table_name="trainings",
    )

    op.execute(
        "ALTER TABLE trainings "
        "RENAME COLUMN introductory_training_id "
        "TO introductory_process_id"
    )

    op.create_index(
        "ix_trainings_introductory_process_id",
        "trainings",
        ["introductory_process_id"],
        unique=False,
    )

    # Обновление ограничений обучения
    with op.batch_alter_table(
        "trainings"
    ) as batch_op:
        batch_op.drop_constraint(
            "ck_introductory_training_test_result",
            type_="check",
        )

        batch_op.create_check_constraint(
            "ck_training_test_result",
            (
                "test_result IS NULL "
                "OR (test_result >= 0 AND test_result <= 100)"
            ),
        )

        batch_op.create_check_constraint(
            "ck_training_dates",
            (
                "training_date IS NULL "
                "OR test_date IS NULL "
                "OR test_date >= training_date"
            ),
        )


def downgrade() -> None:
    # Возврат старых ограничений обучения
    with op.batch_alter_table(
        "trainings"
    ) as batch_op:
        batch_op.drop_constraint(
            "ck_training_dates",
            type_="check",
        )

        batch_op.drop_constraint(
            "ck_training_test_result",
            type_="check",
        )

        batch_op.create_check_constraint(
            "ck_introductory_training_test_result",
            "test_result >= 0 AND test_result <= 100",
        )

    # Возврат старого имени FK обучения
    op.drop_index(
        "ix_trainings_introductory_process_id",
        table_name="trainings",
    )

    op.execute(
        "ALTER TABLE trainings "
        "RENAME COLUMN introductory_process_id "
        "TO introductory_training_id"
    )

    op.create_index(
        "ix_trainings_introductory_training_id",
        "trainings",
        ["introductory_training_id"],
        unique=False,
    )

    # Удаление ограничения дат основной стажировки
    with op.batch_alter_table(
        "main_internships"
    ) as batch_op:
        batch_op.drop_constraint(
            "ck_main_internship_dates",
            type_="check",
        )

    # Возврат старого имени FK основной стажировки
    op.drop_index(
        "ix_main_internships_introductory_process_id",
        table_name="main_internships",
    )

    op.execute(
        "ALTER TABLE main_internships "
        "RENAME COLUMN introductory_process_id "
        "TO introductory_training_id"
    )

    op.create_index(
        "ix_main_internships_introductory_training_id",
        "main_internships",
        ["introductory_training_id"],
        unique=False,
    )

    # Возврат старого имени FK вводной стажировки
    op.drop_index(
        (
            "ix_introductory_internships_"
            "introductory_process_id"
        ),
        table_name="introductory_internships",
    )

    op.execute(
        "ALTER TABLE introductory_internships "
        "RENAME COLUMN introductory_process_id "
        "TO introductory_training_id"
    )

    op.create_index(
        (
            "ix_introductory_internships_"
            "introductory_training_id"
        ),
        "introductory_internships",
        ["introductory_training_id"],
        unique=False,
    )

    # Удаление ограничения дат родительского процесса
    with op.batch_alter_table(
        "introductory_process"
    ) as batch_op:
        batch_op.drop_constraint(
            "ck_introductory_process_dates",
            type_="check",
        )