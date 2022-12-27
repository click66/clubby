import datetime
import pytest

from sjcadmin.errors import *
from sjcadmin.models.course import Course
from sjcadmin.models.student import Student, Licence, Payment
from sjcadmin.models.attendance import Attendance


def test_register_student_into_class():
    student = Student.make(name='John Smith')
    course = Course.make('Test', [0])
    Attendance.register_student(student, date=datetime.datetime.today().date(), course=course)


def test_registering_student_reduces_trial_classes():
    student = Student.make(name='John Smith')
    course = Course.make('Test', [0])

    assert student.remaining_trial_sessions == 2

    Attendance.register_student(student=student, date=datetime.datetime.today().date(), course=course)

    assert student.remaining_trial_sessions == 1


def test_student_cannot_be_registered_with_expired_licence():
    student = Student.make(name='John Smith', licence=Licence(
        number=666,
        expires=datetime.datetime(2016, 1, 1).date(),
    ))
    course = Course.make('Test', [0])

    with pytest.raises(ValueError):
        Attendance.register_student(student, date=datetime.datetime(2020, 1, 1), course=course)


def test_unlicenced_student_cannot_be_registered_with_no_remaining_trial_sessions():
    student = Student.make(name='John Smith')
    course = Course.make('Test', [0])

    Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1), course=course)
    Attendance.register_student(student=student, date=datetime.datetime(2021, 1, 1), course=course)

    with pytest.raises(ValueError):
        Attendance.register_student(student=student, date=datetime.datetime.today().date(), course=course)


def test_complementary():
    student = Student.make(name='John smith')
    course = Course.make('Test', [0])

    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1), course=course)
    assert attendance.complementary is False

    attendance.mark_as_complementary()
    assert attendance.is_complementary is True


def test_attendance_prepaid():
    student = Student.make(name='John Smith')
    course = Course.make('Test', [0])
    student.take_payment(Payment.make(datetime=datetime.datetime(2019, 1, 1), course=course))

    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1), course=course)
    assert attendance.complementary is False
    assert attendance.has_paid is False

    attendance.pay()
    assert attendance.has_paid is True
    assert attendance.complementary is False


def test_attendance_prepaid_different_course():
    student = Student.make(name='John Smith')
    course1 = Course.make('Gi', [0])
    course2 = Course.make('NoGi', [0])
    student.take_payment(Payment.make(datetime=datetime.datetime(2019, 1, 1), course=course1))

    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1), course=course2)
    assert attendance.complementary is False
    assert attendance.has_paid is False

    with pytest.raises(NoPaymentFound):
        attendance.pay()


def test_attempt_prepaid_without_payment():
    student = Student.make(name='John Smith')
    course = Course.make('Test', [0])
    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1), course=course)

    with pytest.raises(NoPaymentFound):
        attendance.pay()


def test_take_payment_use_it_and_attempt_prepaid():
    student = Student.make(name='John Smith')
    course = Course.make('Test', [0])
    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1), course=course)

    student.take_payment(Payment.make(datetime=datetime.datetime(2019, 1, 1), course=course))
    attendance.pay()
    assert attendance.has_paid is True
    assert attendance.complementary is False

    second_attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 2, 2), course=course)

    with pytest.raises(NoPaymentFound):
        second_attendance.pay()

def test_cannot_be_paid_and_complementary():
    student = Student.make(name='John Smith')
    course = Course.make('Test course', [0])

    attendance = Attendance.register_student(student=student, date=datetime.datetime(2020, 1, 1), course=course)
    assert attendance.complementary is False
    assert attendance.has_paid is False

    attendance.mark_as_complementary()
    student.take_payment(Payment.make(datetime=datetime.datetime(2019, 1, 1), course=course))
    attendance.pay()
    assert attendance.complementary is False
    assert attendance.has_paid is True

    attendance.mark_as_complementary()
    assert attendance.complementary is True
    assert attendance.has_paid is False
