from enum import Enum


class CandidateType(str, Enum):
    FORMER_EMPLOYEE = "former_employee"
    EXTERNAL_CANDIDATE = "external_candidate"


class HiringRejectionReason(str, Enum):
    CANDIDATE_REFUSED = "candidate_refused"
    EMPLOYER_REFUSED = "employer_refused"
    DOCUMENT_ISSUES = "document_issues"
    MEDICAL_RESTRICTIONS = "medical_restrictions"
    FAILED_BACKGROUND_CHECK = "failed_background_check"
    POSITION_CLOSED = "position_closed"
    NO_CONTACT = "no_contact"
    OTHER = "other"


class HiringDelayReason(str, Enum):
    DOCUMENTS_PENDING = "documents_pending"
    MEDICAL_EXAM_PENDING = "medical_exam_pending"
    BACKGROUND_CHECK_PENDING = "background_check_pending"
    CANDIDATE_REQUEST = "candidate_request"
    EMPLOYER_REQUEST = "employer_request"
    START_DATE_POSTPONED = "start_date_postponed"
    OTHER = "other"


class SeparationReason(str, Enum):
    VOLUNTARY_RESIGNATION = "voluntary_resignation"
    EMPLOYER_TERMINATION = "employer_termination"
    MUTUAL_AGREEMENT = "mutual_agreement"
    END_OF_CONTRACT = "end_of_contract"
    TRANSFER = "transfer"
    RETIREMENT = "retirement"
    JOB_ABANDONMENT = "job_abandonment"
    OTHER = "other"