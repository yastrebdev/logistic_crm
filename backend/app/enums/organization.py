from enum import Enum


class PositionCategory(str, Enum):
    LINE_STAFF = "line_staff"

    LINE_MANAGER = "line_manager"

    MANAGER = "manager"

    SPECIALIST = "specialist"