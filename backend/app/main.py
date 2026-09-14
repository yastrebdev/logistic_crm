from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.exception_handlers import app_error_handler
from app.exceptions.base import AppError

from app.api.auth import router as auth_router
from app.api.roles import router as roles_router
from app.api.users import router as users_router
from app.api.introdctory_training.introductory_process import (
    router as intro_process_router
)
from app.api.employees import router as employee_router
from app.api.organizations.distribution_centers import (
    router as distribution_center_router
)
from app.api.organizations.division_groups import (
    router as division_group_router
)
from app.api.organizations.divisions import (
    router as division_router,
)
from app.api.organizations.positions import (
    router as position_router,
)
from app.api.notifications import (
    router as notification_router,
)
from app.api.introdctory_training.introductory_internship import (
    router as introductory_internship_router,
)
from app.api.introdctory_training.trainings import (
    router as training_router,
)
from app.api.introdctory_training.main_internships import (
    router as main_internship_router,
)
from app.api.introdctory_training.mentor_payments import (
    router as mentor_payment_router,
)
from app.api.adaptation_policies import (
    router as adaptation_policy_router,
)
from app.api.adaptations import (
    router as adaptation_router,
)
from app.api.internship_policies import (
    router as internship_policy_router,
)
from app.api.onboarding_analytics import (
    router as onboarding_analytics_router,
)
from app.core.config import settings
from app import models


app = FastAPI()


app.add_exception_handler(
    AppError,
    app_error_handler,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(roles_router)
app.include_router(intro_process_router)
app.include_router(introductory_internship_router)
app.include_router(training_router)
app.include_router(main_internship_router)
app.include_router(mentor_payment_router)
app.include_router(employee_router)
app.include_router(distribution_center_router)
app.include_router(division_group_router)
app.include_router(division_router)
app.include_router(position_router)
app.include_router(notification_router)
app.include_router(adaptation_policy_router)
app.include_router(adaptation_router)
app.include_router(internship_policy_router)
app.include_router(onboarding_analytics_router)


@app.get("/")
def root():
    return {"message": "CRM API"}
