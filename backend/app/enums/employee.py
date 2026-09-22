from enum import Enum


class CandidateType(str, Enum):
    EXTERNAL_CANDIDATE = (
        "external_candidate"
    )

    FORMER_EMPLOYEE = (
        "former_employee"
    )

    CONTRACTOR = "contractor"


class HiringRejectionReason(str, Enum):
    SCHEDULE_UNSUITABLE = (
        "schedule_unsuitable"
    )

    CONSIDERING_EMPLOYMENT = (
        "considering_employment"
    )

    MANAGER_REFUSED = (
        "manager_refused"
    )

    SECURITY_REFUSED = (
        "security_refused"
    )

    EMPLOYMENT_CANCELLED = (
        "employment_cancelled"
    )

    WORKING_CONDITIONS_UNSUITABLE = (
        "working_conditions_unsuitable"
    )

    JOB_SPECIFICS_UNSUITABLE = (
        "job_specifics_unsuitable"
    )

    WORKLOAD_TOO_HIGH = (
        "workload_too_high"
    )

    SALARY_UNSUITABLE = (
        "salary_unsuitable"
    )

    HEAVY_PHYSICAL_WORK = (
        "heavy_physical_work"
    )

    NO_CONTACT = "no_contact"

    INTERN = "intern"

    FOUND_ANOTHER_JOB = (
        "found_another_job"
    )

    EQUIPMENT_DIFFICULTIES = (
        "equipment_difficulties"
    )

    DOCUMENT_ISSUES = (
        "document_issues"
    )

    CONTRACTOR = "contractor"


class HiringDelayReason(str, Enum):
    OUTSOURCING = "outsourcing"

    DOCUMENT_ISSUES = (
        "document_issues"
    )

    PATENT_REPLACEMENT_REQUIRED = (
        "patent_replacement_required"
    )

    NOTICE_PERIOD_AT_PREVIOUS_JOB = (
        "notice_period_at_previous_job"
    )

    WAITING_FOR_VACANCY = (
        "waiting_for_vacancy"
    )

    TEMPORARY_CIVIL_CONTRACT = (
        "temporary_civil_contract"
    )

    CONSIDERING_EMPLOYMENT = (
        "considering_employment"
    )


class SeparationReason(str, Enum):
    TRANSFER_TERMINATION = (
        "transfer_termination"
    )

    DOCUMENTS_EXPIRED = (
        "documents_expired"
    )

    INTERNAL_PART_TIME_END = (
        "internal_part_time_end"
    )

    RELOCATION = "relocation"

    DEATH = "death"

    MILITARY_SERVICE = (
        "military_service"
    )

    SALARY_UNSUITABLE = (
        "salary_unsuitable"
    )

    MANAGER_UNSUITABLE = (
        "manager_unsuitable"
    )

    SCHEDULE_UNSUITABLE = (
        "schedule_unsuitable"
    )

    JOB_UNSUITABLE = (
        "job_unsuitable"
    )

    WORKLOAD_TOO_HIGH = (
        "workload_too_high"
    )

    NO_CAREER_GROWTH = (
        "no_career_growth"
    )

    FOUND_JOB_IN_SPECIALTY = (
        "found_job_in_specialty"
    )

    HEALTH_REASONS = (
        "health_reasons"
    )

    FAMILY_CARE = "family_care"

    THEFT = "theft"

    MANAGEMENT_INITIATIVE = (
        "management_initiative"
    )

    PERFORMANCE_FAILURE = (
        "performance_failure"
    )

    ABSENCE = "absence"

    LOST_CONTACT = "lost_contact"

    STAFF_OPTIMIZATION = (
        "staff_optimization"
    )

    MATERNITY_LEAVE_NO_RETURN = (
        "maternity_leave_no_return"
    )

    UNKNOWN = "unknown"

    INTERNAL_PRIMARY_EMPLOYMENT = (
        "internal_primary_employment"
    )

    RETIREMENT = "retirement"

    HOLIDAY_WORK = "holiday_work"

    GARDEN_SEASON = "garden_season"

    POLYGRAPH = "polygraph"

    STUDENTS = "students"

    EXTERNAL_PART_TIME_END = (
        "external_part_time_end"
    )

    BANKRUPTCY = "bankruptcy"

    REEMPLOYMENT_DC = (
        "reemployment_dc"
    )

    DESTRUCTIVE_BEHAVIOR = (
        "destructive_behavior"
    )

    BENEFITS = "benefits"

    NOT_IDENTIFIED = (
        "not_identified"
    )