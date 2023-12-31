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
    def fetch_for_course(
        cls,
        course: Course,
        earliest: date,
        latest: date,
    ):
        return cls.objects.filter(date__gte=earliest, date__lte=latest, _course=course)

    @classmethod
    def register_student(
            cls,
            student: Student,
            course: Course,
            date: datetime.date,
    ):
        if student.is_licence_expired():
            raise ExpiredStudentLicenceError('Student licence is expired')

        if not student.has_licence() and student.remaining_trial_sessions <= 0:
            raise NoRemainingTrialSessionsError(
                'Unlicenced member has no remaining trial sessions')

        attendance = Attendance(student=student, date=date, _course=course)
        student.increment_attendance()
        return attendance

    @classmethod
    def clear(cls, student: Student, date: datetime.date):
        existing = Attendance.objects.filter(student=student, date=date)
        student.decrement_attendance(existing.count())
        existing.delete()

    @property
    def course(self):
        return self._course

    @property
    def student_name(self):
        return self.student.name

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

    def pay(self, use_subscription=False):
        prepayment = self.student.has_prepaid(self._course)
        subscription = self.student.has_subscription(self._course, self.date)
        if not prepayment and not subscription:  # Student has not prepaid and as no usable subscription
            raise NoPaymentFound(
                'Usable payment method was not found on account')

        self.complementary = False
        self.paid = True
        if prepayment and not use_subscription:
            prepayment.mark_used()
