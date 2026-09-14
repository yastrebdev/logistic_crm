from enum import Enum


class AdmissionFormat(str, Enum):
    TEST_FORM = "The test is on the form"
    TEST_PORTAL = "The test on the portal"
    EXAM = "Exam"
    INTERVIEW = "Interview"


class MentorAssignmentStatus(str, Enum):
    PREVIOUSLY_EMPLOYED = "Previously employed"
    MPO_IS_MENTOR = "MPO is the mentor"
    MENTOR_NOT_REQUIRED = "Mentor is not required"
    MENTOR_ASSIGNED = "Mentor is assigned"