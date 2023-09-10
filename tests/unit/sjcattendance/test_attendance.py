import pytest

from datetime import date
from sjcadmin.sjcattendance.errors import *
from sjcadmin.sjcattendance.models.attendance import Attendance, Resolution
from uuid import uuid4


def test_create_attendance():
    # Given a date, course UUID and student UUID
    today = date.today()
    course_uuid = uuid4()
    student_uuid = uuid4()

    # When I create an attendance record
    sut = Attendance.make(date=today,
                          course_uuid=course_uuid,
                          student_uuid=student_uuid)

    # Then I can retrieve that information
    assert sut.date is today
    assert sut.course_uuid is course_uuid
    assert sut.student_uuid is student_uuid


def test_single_attendance_cannot_be_both_paid_and_complementary():
    # Given I have an unresolved attendance record
    sut = Attendance.make(date.today(), uuid4(), uuid4())

    # An error is raised
    with pytest.raises(InvalidAttendanceResolution):
        # If I try and resolve it both paid and complementary
        sut.set_resolution(Resolution.make(paid=True, complementary=True))


def test_is_attendance_paid():
    # Given I have an unresolved attendance
    sut = Attendance.make(date.today(), uuid4(), uuid4())

    # When I query if it has been paid
    result = sut.paid

    # Then the model returns False
    assert result is False

    # But when I give it a resolution
    scenarios = [
        (Resolution.make(False, False), False),
        (Resolution.make(False, True), False),
        (Resolution.make(True, False), True),
    ]

    for scenario, expected in scenarios:
        sut.set_resolution(scenario)

        # Then the model returns the expected result
        assert sut.paid is expected


def test_is_attendance_complementary():
    # Given I have an unresolved attendance
    sut = Attendance.make(date.today(), uuid4(), uuid4())

    # When I query if it was complementary
    result = sut.complementary

    # Then the model returns False
    assert result is False

    # But when I give it a resolution
    scenarios = [
        (Resolution.make(False, False), False),
        (Resolution.make(True, False), False),
        (Resolution.make(False, True), True),
    ]
    for scenario, expected in scenarios:
        sut.set_resolution(scenario)

        # Then the model returns the expected result
        assert sut.complementary is expected
