from datetime import date
from urllib.parse import quote

from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.exceptions.base import (
    BusinessRuleError,
)

from app.api.dependencies.permissions import (
    require_permission,
)
from app.db.database import get_db
from app.models import User
from app.schemas.onboarding_analytics import (
    OnboardingAnalyticsListResponse,
)
from app.services.onboarding_analytics_service import (
    get_onboarding_analytics,
)
from app.services.onboarding_excel_service import (
    create_onboarding_excel,
)


router = APIRouter(
    prefix="/analytics/onboarding",
    tags=["Onboarding analytics"],
)


@router.get(
    "/export",
    response_class=StreamingResponse,
)
def export_onboarding_report(
    distribution_center_id: int | None = Query(
        default=None,
        ge=1,
    ),
    division_group_id: int | None = Query(
        default=None,
        ge=1,
    ),
    division_id: int | None = Query(
        default=None,
        ge=1,
    ),
    position_id: int | None = Query(
        default=None,
        ge=1,
    ),
    tutor_id: int | None = Query(
        default=None,
        ge=1,
    ),
    hire_date_from: date | None = None,
    hire_date_to: date | None = None,
    employee_search: str | None = Query(
        default=None,
        min_length=1,
        max_length=255,
    ),
    overdue_only: bool = False,
    has_risk_only: bool = False,
    payment_pending_only: bool = False,
    _current_user: User = Depends(
        require_permission(
            "organization.read"
        )
    ),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    export_limit = 100_000

    total, rows = get_onboarding_analytics(
        db=db,
        page=1,
        page_size=export_limit + 1,
        distribution_center_id=(
            distribution_center_id
        ),
        division_group_id=(
            division_group_id
        ),
        division_id=division_id,
        position_id=position_id,
        tutor_id=tutor_id,
        hire_date_from=hire_date_from,
        hire_date_to=hire_date_to,
        employee_search=employee_search,
        overdue_only=overdue_only,
        has_risk_only=has_risk_only,
        payment_pending_only=(
            payment_pending_only
        ),
    )

    if total > export_limit:
        raise BusinessRuleError(
            "The report contains more than "
            f"{export_limit} rows. "
            "Apply additional filters before export"
        )

    excel_file = create_onboarding_excel(
        rows
    )

    filename = (
        "onboarding_report_"
        f"{date.today().isoformat()}.xlsx"
    )

    encoded_filename = quote(filename)

    return StreamingResponse(
        excel_file,
        media_type=(
            "application/vnd.openxmlformats-"
            "officedocument.spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                "attachment; "
                f"filename={filename}; "
                "filename*=UTF-8''"
                f"{encoded_filename}"
            ),
            "Access-Control-Expose-Headers": (
                "Content-Disposition"
            ),
        },
    )


@router.get(
    "",
    response_model=OnboardingAnalyticsListResponse,
)
def get_onboarding_report(
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    distribution_center_id: int | None = Query(
        default=None,
        ge=1,
    ),
    division_group_id: int | None = Query(
        default=None,
        ge=1,
    ),
    division_id: int | None = Query(
        default=None,
        ge=1,
    ),
    position_id: int | None = Query(
        default=None,
        ge=1,
    ),
    tutor_id: int | None = Query(
        default=None,
        ge=1,
    ),
    hire_date_from: date | None = None,
    hire_date_to: date | None = None,
    employee_search: str | None = Query(
        default=None,
        min_length=1,
        max_length=255,
    ),
    overdue_only: bool = False,
    has_risk_only: bool = False,
    payment_pending_only: bool = False,
    _current_user: User = Depends(
        require_permission("organization.read")
    ),
    db: Session = Depends(get_db),
) -> OnboardingAnalyticsListResponse:
    total, rows = get_onboarding_analytics(
        db=db,
        page=page,
        page_size=page_size,
        distribution_center_id=(
            distribution_center_id
        ),
        division_group_id=division_group_id,
        division_id=division_id,
        position_id=position_id,
        tutor_id=tutor_id,
        hire_date_from=hire_date_from,
        hire_date_to=hire_date_to,
        employee_search=employee_search,
        overdue_only=overdue_only,
        has_risk_only=has_risk_only,
        payment_pending_only=(
            payment_pending_only
        ),
    )

    return OnboardingAnalyticsListResponse(
        items=rows,
        total=total,
        page=page,
        page_size=page_size,
    )