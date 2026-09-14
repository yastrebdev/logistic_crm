from enum import Enum


class MethodExecutionAdaptation(str, Enum):
    PERSON = "in person"
    PORTAL = "on portal"
    CALL = "a phone call"
    YANDEX = "yandex form"


class AdaptationDelayReason(str, Enum):
    EMPLOYEE_ABSENT = "Employee absent"
    SUPERVISOR_ABSENT = "Supervisor absent"
    MPO_ABSENT = "MPO absent"
    MPP_ABSENT = "MPP absent"
    SCHEDULE_CONFLICT = "Schedule conflict"
    TECHNICAL_ISSUES = "Technical issues"
    WORKLOAD = "High workload"
    ADAPTATION_RESCHEDULED = "Adaptation rescheduled"
    OTHER = "Other"


class AdaptationParticipants(str, Enum):
    MPO_ONLY = "MPO"
    MPO_AND_MPP = "MPO and MPP"
    MPO_AND_SUPERVISOR = "MPO and supervisor"
    MPO_MPP_AND_SUPERVISOR = "MPO, MPP and supervisor"


class RiskZone(str, Enum):
    GREEN = "Green"
    YELLOW = "Yellow"
    RED = "Red"


class AdaptationRiskReason(str, Enum):
    LOW_PERFORMANCE = "Low performance"
    INSUFFICIENT_SKILLS = "Insufficient skills"
    LOW_MOTIVATION = "Low motivation"
    ATTENDANCE_ISSUES = "Attendance issues"
    DISCIPLINARY_ISSUES = "Disciplinary issues"
    DIFFICULTIES_WITH_TEAM = "Difficulties working with the team"
    DIFFICULTIES_WITH_SUPERVISOR = "Difficulties working with the supervisor"
    FAILURE_TO_MEET_ADAPTATION_GOALS = "Failure to meet adaptation goals"
    OTHER = "Other"


class AdaptationProcessStatus(str, Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"