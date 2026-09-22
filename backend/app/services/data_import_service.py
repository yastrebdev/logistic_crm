from collections.abc import Sequence
from hashlib import sha256

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.enums.data_import import (
    ImportRowStatus,
    ImportStatus,
    ImportType,
)
from app.exceptions.base import (
    ConflictError,
    NotFoundError,
)
from app.models import (
    ImportJob,
    ImportJobRow,
    User,
)
from app.services.imports.onboarding_excel_parser import (
    parse_onboarding_excel,
)
from app.services.imports.onboarding_reference_resolver import (
    OnboardingReferenceResolver,
)
from app.services.imports.onboarding_value_mapper import (
    map_onboarding_values,
)
from app.services.imports.onboarding_import_executor import (
    execute_onboarding_import as run_onboarding_import,
)


def create_onboarding_import_preview(
    db: Session,
    content: bytes,
    filename: str,
    actor: User,
) -> ImportJob:
    parsed_rows = parse_onboarding_excel(
        content
    )

    import_job = ImportJob(
        import_type=(
            ImportType.ONBOARDING_HISTORY
        ),
        status=ImportStatus.VALIDATING,
        filename=filename,
        sheet_name="ВА",
        file_hash=sha256(content).hexdigest(),
        created_by_user_id=actor.id,
        total_rows=len(parsed_rows),
    )

    db.add(import_job)
    db.flush()

    resolver = OnboardingReferenceResolver(
        db
    )

    valid_rows = 0
    warning_rows = 0
    error_rows = 0

    for parsed_row in parsed_rows:
        (
            normalized_data,
            warnings,
            errors,
        ) = resolver.resolve(
            normalized_data=(
                parsed_row.normalized_data
            ),
            source_warnings=(
                parsed_row.warnings
            ),
            source_errors=(
                parsed_row.errors
            ),
        )

        (
            normalized_data,
            warnings,
            errors,
        ) = map_onboarding_values(
            normalized_data=normalized_data,
            source_warnings=warnings,
            source_errors=errors,
        )

        if errors:
            row_status = (
                ImportRowStatus.ERROR
            )
            error_rows += 1
        elif warnings:
            row_status = (
                ImportRowStatus.WARNING
            )
            warning_rows += 1
        else:
            row_status = (
                ImportRowStatus.VALID
            )
            valid_rows += 1

        db.add(
            ImportJobRow(
                import_job_id=(
                    import_job.id
                ),
                excel_row_number=(
                    parsed_row
                    .excel_row_number
                ),
                source_row_id=(
                    parsed_row
                    .source_row_id
                ),
                status=row_status,
                raw_data=(
                    parsed_row.raw_data
                ),
                normalized_data=(
                    normalized_data
                ),
                warnings=warnings,
                errors=errors,
            )
        )

    import_job.valid_rows = valid_rows
    import_job.warning_rows = warning_rows
    import_job.error_rows = error_rows
    import_job.status = ImportStatus.READY

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        raise ConflictError(
            "Could not save the import preview"
        ) from None

    db.refresh(import_job)

    return import_job


def get_import_job(
    db: Session,
    import_job_id: int,
) -> ImportJob:
    import_job = db.get(
        ImportJob,
        import_job_id,
    )

    if import_job is None:
        raise NotFoundError(
            "Import job not found"
        )

    return import_job


def get_import_job_rows(
    db: Session,
    import_job_id: int,
    page: int,
    page_size: int,
    status: ImportRowStatus | None = None,
) -> tuple[
    int,
    Sequence[ImportJobRow],
]:
    get_import_job(
        db=db,
        import_job_id=import_job_id,
    )

    filters = [
        ImportJobRow.import_job_id
        == import_job_id
    ]

    if status is not None:
        filters.append(
            ImportJobRow.status == status
        )

    total = db.scalar(
        select(
            func.count(
                ImportJobRow.id
            )
        ).where(*filters)
    ) or 0

    offset = (
        page - 1
    ) * page_size

    rows = db.scalars(
        select(ImportJobRow)
        .where(*filters)
        .order_by(
            ImportJobRow
            .excel_row_number
        )
        .offset(offset)
        .limit(page_size)
    ).all()

    return total, rows


def execute_onboarding_import(
    db: Session,
    import_job_id: int,
) -> ImportJob:
    return run_onboarding_import(
        db=db,
        import_job_id=import_job_id,
    )