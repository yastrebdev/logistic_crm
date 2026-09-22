from enum import Enum


class PaymentStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    PAID = "Paid"
    CANCELLED = "Cancelled"


class NonPaymentReason(str, Enum):
    TRAINEE_TERMINATED = (
        "trainee_terminated"
    )

    MENTOR_TERMINATED = (
        "mentor_terminated"
    )

    MISSING_SUPPORTING_DOCUMENTS = (
        "missing_supporting_documents"
    )

    TWO_MENTORS = "two_mentors"

    INCOMPLETE_INTERNSHIP = (
        "incomplete_internship"
    )


class PaymentRegistrationMethod(str, Enum):
    MENTORING = "mentoring"

    OTHER_BONUS = "other_bonus"