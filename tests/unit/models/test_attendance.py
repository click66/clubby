import datetime
import pytest

from sjcadmin.errors import *
from sjcadmin.models.student import Student, Profile, Licence, Payment
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


def test_complementary():
    student = Student.make(name='John smith')

    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1))
    assert attendance.complementary is False

    attendance.mark_as_complementary()
    assert attendance.is_complementary is True


def test_cannot_be_paid_and_complementary():
    student = Student.make(name='John Smith')

    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1))
    assert attendance.complementary is False
    assert attendance.has_paid is False

    attendance.mark_as_complementary()
    attendance.mark_as_paid()
    assert attendance.complementary is False
    assert attendance.has_paid is True

    attendance.mark_as_complementary()
    assert attendance.complementary is True
    assert attendance.has_paid is False


def test_attendance_prepaid():
    student = Student.make(name='John Smith')
    student.take_payment(Payment.make(datetime=datetime.datetime(2019, 1, 1)))

    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1))
    assert attendance.complementary is False
    assert attendance.has_paid is False

    attendance.prepaid()
    assert attendance.has_paid is True
    assert attendance.complementary is False


def test_attempt_prepaid_without_payment():
    student = Student.make(name='John Smith')
    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1))

    with pytest.raises(NoPaymentFound):
        attendance.prepaid()


def test_take_payment_use_it_and_attempt_prepaid():
    student = Student.make(name='John Smith')
    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1))

    student.take_payment(Payment.make(datetime=datetime.datetime(2019, 1, 1)))
    attendance.prepaid()
    assert attendance.has_paid is True
    assert attendance.complementary is False

    second_attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 2, 2))

    with pytest.raises(NoPaymentFound):
        second_attendance.prepaid()
