from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.api.dependencies.permissions import (
    require_permission,
)
from app.db.database import get_db
from app.enums.data_import import (
    ImportRowStatus,
)
from app.exceptions.base import BusinessRuleError
from app.models import User
from app.schemas.data_import import (
    ImportJobResponse,
    ImportJobRowListResponse,
)
from app.services import data_import_service


MAX_FILE_SIZE = 25 * 1024 * 1024

ALLOWED_FILE_EXTENSIONS = {
    ".xlsx",
    ".xlsm",
}


router = APIRouter(
    prefix="/imports",
    tags=["Data imports"],
)


@router.post(
    "/onboarding/preview",
    response_model=ImportJobResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_onboarding_import_preview(
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_permission("imports.create")
    ),
    db: Session = Depends(get_db),
) -> ImportJobResponse:
    filename = Path(
        file.filename or "onboarding.xlsx"
    ).name

    extension = Path(
        filename
    ).suffix.lower()

    if extension not in ALLOWED_FILE_EXTENSIONS:
        raise BusinessRuleError(
            "Only .xlsx and .xlsm files "
            "are supported"
        )

    content = file.file.read(
        MAX_FILE_SIZE + 1
    )

    if len(content) > MAX_FILE_SIZE:
        raise BusinessRuleError(
            "The uploaded file is larger "
            "than 25 MB"
        )

    return (
        data_import_service
        .create_onboarding_import_preview(
            db=db,
            content=content,
            filename=filename,
            actor=current_user,
        )
    )


@router.get(
    "/{import_job_id}",
    response_model=ImportJobResponse,
)
def get_import_job(
    import_job_id: int,
    _current_user: User = Depends(
        require_permission("imports.read")
    ),
    db: Session = Depends(get_db),
) -> ImportJobResponse:
    return data_import_service.get_import_job(
        db=db,
        import_job_id=import_job_id,
    )


@router.get(
    "/{import_job_id}/rows",
    response_model=ImportJobRowListResponse,
)
def get_import_job_rows(
    import_job_id: int,
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=50,
        ge=1,
        le=200,
    ),
    row_status: ImportRowStatus | None = Query(
        default=None,
        alias="status",
    ),
    _current_user: User = Depends(
        require_permission("imports.read")
    ),
    db: Session = Depends(get_db),
) -> ImportJobRowListResponse:
    total, rows = (
        data_import_service
        .get_import_job_rows(
            db=db,
            import_job_id=import_job_id,
            page=page,
            page_size=page_size,
            status=row_status,
        )
    )

    return ImportJobRowListResponse(
        items=list(rows),
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/{import_job_id}/execute",
    response_model=ImportJobResponse,
    status_code=status.HTTP_200_OK,
)
def execute_onboarding_import(
    import_job_id: int,
    _current_user: User = Depends(
        require_permission(
            "imports.execute"
        )
    ),
    db: Session = Depends(get_db),
) -> ImportJobResponse:
    return (
        data_import_service
        .execute_onboarding_import(
            db=db,
            import_job_id=import_job_id,
        )
    )