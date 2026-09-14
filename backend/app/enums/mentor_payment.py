from enum import Enum


class PaymentStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    PAID = "Paid"
    CANCELLED = "Cancelled"


class NonPaymentReason(str, Enum):
    INTERNSHIP_NOT_COMPLETED = "Internship not completed"
    INSUFFICIENT_INTERNSHIP_DURATION = "Insufficient internship duration"
    MENTOR_NOT_ELIGIBLE = "Mentor is not eligible for payment"
    EMPLOYEE_LEFT_EARLY = "Employee left before completion"
    MENTOR_LEFT_EARLY = "Mentor left before completion"
    DUPLICATE_PAYMENT = "Duplicate payment"
    PAYMENT_ALREADY_PROCESSED = "Payment already processed"
    INCORRECT_DATA = "Incorrect data"
    MANAGEMENT_DECISION = "Management decision"
    OTHER = "Other"