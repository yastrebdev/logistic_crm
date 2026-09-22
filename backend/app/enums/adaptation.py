from enum import Enum


class MethodExecutionAdaptation(str, Enum):
    PORTAL = "portal"
    IN_PERSON = "in_person"
    CALL = "call"
    YANDEX_FORM = "yandex_form"


class AdaptationDelayReason(str, Enum):
    ILLNESS = "illness"

    SHIFT_MISMATCH = (
        "shift_mismatch"
    )

    LOST_CONTACT = "lost_contact"

    NO_RESPONSE = "no_response"

    MPO_VACATION_OR_SICK_LEAVE = (
        "mpo_vacation_or_sick_leave"
    )

    MANAGER_REFUSED = (
        "manager_refused"
    )

    EMPLOYEE_REFUSED = (
        "employee_refused"
    )

    NIGHT_SHIFT = "night_shift"

    MPO_PORTAL_OR_SICK_LEAVE = (
        "mpo_portal_or_sick_leave"
    )


class AdaptationParticipants(str, Enum):
    MPO = "mpo"

    MPO_AND_MPP = "mpo_and_mpp"

    MPO_AND_MANAGER = (
        "mpo_and_manager"
    )

    MPO_MPP_AND_MANAGER = (
        "mpo_mpp_and_manager"
    )

    REMOTE = "remote"


class AdaptationZone(str, Enum):
    YELLOW = "yellow"


class AdaptationRiskZone(str, Enum):
    RED = "red"


class AdaptationRiskReason(str, Enum):
    WORKLOAD_TOO_HIGH = (
        "workload_too_high"
    )

    SCHEDULE_UNSUITABLE = (
        "schedule_unsuitable"
    )

    SALARY_UNSUITABLE = (
        "salary_unsuitable"
    )

    JOB_UNSUITABLE = (
        "job_unsuitable"
    )

    PENALTY_SYSTEM_UNSUITABLE = (
        "penalty_system_unsuitable"
    )

    WORKING_CONDITIONS_UNSUITABLE = (
        "working_conditions_unsuitable"
    )

    MANAGER_RELATIONSHIP_ISSUES = (
        "manager_relationship_issues"
    )

    PLANNING_RELOCATION = (
        "planning_relocation"
    )

    HEALTH_REASONS = (
        "health_reasons"
    )

    LOST_CONTACT = "lost_contact"

    EQUIPMENT_PERFORMANCE = (
        "equipment_performance"
    )

    SEASONAL_STUDENT = (
        "seasonal_student"
    )

    HEAVY_WORK = "heavy_work"


class AdaptationProcessStatus(str, Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"