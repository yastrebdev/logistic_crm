from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.enums.data_import import (
    ImportRowStatus,
    ImportStatus,
    ImportType,
)


class ImportJobResponse(BaseModel):
    id: int
    import_type: ImportType
    status: ImportStatus

    filename: str
    sheet_name: str

    created_by_user_id: int | None

    total_rows: int
    valid_rows: int
    warning_rows: int
    error_rows: int
    imported_rows: int

    error_message: str | None

    created_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True,
    )


class ImportJobRowResponse(BaseModel):
    id: int
    import_job_id: int

    excel_row_number: int
    source_row_id: str | None

    status: ImportRowStatus

    raw_data: dict[str, Any]

    normalized_data: (
        dict[str, Any] | None
    )

    warnings: list[str]
    errors: list[str]

    result_data: (
        dict[str, Any] | None
    )

    model_config = ConfigDict(
        from_attributes=True,
    )


class ImportJobRowListResponse(BaseModel):
    items: list[ImportJobRowResponse]

    total: int
    page: int
    page_size: int