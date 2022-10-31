import datetime
from django.db import models

from ..errors import *
from .student import Student


class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.RESTRICT)
    date = models.DateField(null=False)
    paid = models.BooleanField(default=False, null=False)

    @classmethod
    def register_student(
            cls,
            student: Student,
            date: datetime.date
    ):
        if student.is_licence_expired():
            raise ExpiredStudentLicenceError('Student licence is expired')

        if not student.has_licence() and student.remaining_trial_sessions <= 0:
            raise NoRemainingTrialSessionsError('Unlicenced student has no remaining trial sessions')

        student.sessions_attended += 1
        return Attendance(student=student, date=date)

    def mark_as_paid(self):
        self.paid = True

    @property
    def has_paid(self):
        return self.paid

    @property
    def session_date(self):
        return self.date
