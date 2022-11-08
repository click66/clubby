import datetime
import pytest

from sjcadmin.models.student import Student, Profile, Licence
from sjcadmin.models.attendance import Attendance


def test_register_student_into_class():
    student = Student.make(name='John Smith')
    Attendance.register_student(student, date=datetime.datetime.today().date())


def test_registering_student_reduces_trial_classes():
    student = Student.make(name='John Smith')

    assert student.remaining_trial_sessions == 2

    Attendance.register_student(student=student, date=datetime.datetime.today().date())

    assert student.remaining_trial_sessions == 1


def test_student_cannot_be_registered_with_expired_licence():
    student = Student.make(name='John Smith', licence=Licence(
        number=666,
        expires=datetime.datetime(2016, 1, 1).date(),
    ))

    with pytest.raises(ValueError):
        Attendance.register_student(student, datetime.datetime.today().date())


def test_unlicenced_student_cannot_be_registered_with_no_remaining_trial_sessions():
    student = Student.make(name='John Smith')

    Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1))
    Attendance.register_student(student=student, date=datetime.datetime(2021, 1, 1))

    with pytest.raises(ValueError):
        Attendance.register_student(student=student, date=datetime.datetime.today().date())


def test_unpaid_and_paid():
    student = Student.make(name='John Smith')

    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1))
    assert attendance.has_paid is False

    attendance.mark_as_paid()
    assert attendance.has_paid is True
