from datetime import datetime
from typing import Any

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.database import Base
from app.enums.base import enum_values
from app.enums.data_import import (
    ImportRowStatus,
    ImportStatus,
    ImportType,
)


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    import_type: Mapped[ImportType] = mapped_column(
        SQLEnum(
            ImportType,
            values_callable=enum_values,
            name="import_type",
        ),
        nullable=False,
        index=True,
    )

    status: Mapped[ImportStatus] = mapped_column(
        SQLEnum(
            ImportStatus,
            values_callable=enum_values,
            name="import_status",
        ),
        nullable=False,
        default=ImportStatus.VALIDATING,
        index=True,
    )

    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    sheet_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="ВА",
    )

    file_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    created_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    total_rows: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    valid_rows: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    warning_rows: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    error_rows: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    imported_rows: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_by: Mapped["User | None"] = relationship()

    rows: Mapped[list["ImportJobRow"]] = relationship(
        back_populates="import_job",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ImportJobRow.excel_row_number",
    )


class ImportJobRow(Base):
    __tablename__ = "import_job_rows"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    import_job_id: Mapped[int] = mapped_column(
        ForeignKey(
            "import_jobs.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    excel_row_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    source_row_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    status: Mapped[ImportRowStatus] = mapped_column(
        SQLEnum(
            ImportRowStatus,
            values_callable=enum_values,
            name="import_row_status",
        ),
        nullable=False,
        index=True,
    )

    raw_data: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
    )

    normalized_data: Mapped[
        dict[str, Any] | None
    ] = mapped_column(
        JSON,
        nullable=True,
    )

    warnings: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    errors: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    result_data: Mapped[
        dict[str, Any] | None
    ] = mapped_column(
        JSON,
        nullable=True,
    )

    import_job: Mapped["ImportJob"] = relationship(
        back_populates="rows",
    )

    __table_args__ = (
        UniqueConstraint(
            "import_job_id",
            "excel_row_number",
            name="uq_import_job_excel_row",
        ),
        Index(
            "ix_import_job_rows_job_status",
            "import_job_id",
            "status",
        ),
    )