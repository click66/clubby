class DomainError(ValueError):
    pass


class MissingStudentInformationError(DomainError):
    pass


class ExpiredStudentLicenceError(DomainError):
    pass


class NoRemainingTrialSessionsError(DomainError):
    pass


class NoPaymentFound(DomainError):
    pass
