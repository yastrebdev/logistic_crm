from fastapi import Request
from fastapi.responses import JSONResponse

from app.exceptions.base import AppError


async def app_error_handler(
    request: Request,
    exc: AppError,
):
    detail: str | dict = exc.message

    if exc.details is not None:
        detail = {
            "message": exc.message,
            **exc.details,
        }

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": detail},
    )