import datetime
from django.db import models

from ..errors import *
from .course import Course
from .student import Student


class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.RESTRICT)
    date = models.DateField(null=False)
    paid = models.BooleanField(default=False, null=False)
    complementary = models.BooleanField(default=False, null=False)
    _course = models.ForeignKey(
        'Course', null=True, on_delete=models.SET_NULL, db_column='course_uuid')

    @classmethod
    def register_student(
            cls,
            student: Student,
            course: Course,
            date: datetime.date,
            existing_registration: bool = False,
    ):
        remaining_sessions = student.remaining_trial_sessions + (1 if existing_registration else 0)

        if student.is_licence_expired():
            raise ExpiredStudentLicenceError('Student licence is expired')

        if not student.has_licence() and remaining_sessions <= 0:
            raise NoRemainingTrialSessionsError('Unlicenced student has no remaining trial sessions')

        attendance = Attendance(student=student, date=date, _course=course)
        student.increment_attendance()
        return attendance

    @classmethod
    def clear(cls, student: Student, date: datetime.date):
        existing = Attendance.objects.filter(student=student, date=date)
        student.decrement_attendance(existing.count())
        existing.delete()

    @property
    def has_paid(self):
        return self.paid

    @property
    def session_date(self):
        return self.date

    @property
    def is_complementary(self):
        return self.complementary
    
    def mark_as_complementary(self):
        self.complementary = True
        self.paid = False

    def pay(self):
        prepayment = self.student.has_prepaid(self._course)
        if not prepayment:  # Student has not prepaid
            raise NoPaymentFound('Usable payment was not found on account')
        
        self.complementary = False
        self.paid = True
        prepayment.mark_used()
