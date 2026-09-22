from enum import Enum


class ImportType(str, Enum):
    ONBOARDING_HISTORY = (
        "onboarding_history"
    )


class ImportStatus(str, Enum):
    VALIDATING = "validating"
    READY = "ready"
    IMPORTING = "importing"
    COMPLETED = "completed"
    FAILED = "failed"


class ImportRowStatus(str, Enum):
    VALID = "valid"
    WARNING = "warning"
    ERROR = "error"
    IMPORTED = "imported"
    SKIPPED = "skipped"