import datetime
import pytest

from sjcadmin.sjcadmin.models.course import Course


def test_can_check_if_session_date():
    course = Course.make(days=[0, 3], label='Foo')

    monday = datetime.datetime(2022, 12, 19)
    tuesday = datetime.datetime(2022, 12, 20)
    wednesday = datetime.datetime(2022, 12, 21)
    thursday = datetime.datetime(2022, 12, 22)
    friday = datetime.datetime(2022, 12, 23)
    saturday = datetime.datetime(2022, 12, 24)
    sunday = datetime.datetime(2022, 12, 25)

    assert course.is_session_date(monday) is True
    assert course.is_session_date(tuesday) is False
    assert course.is_session_date(wednesday) is False
    assert course.is_session_date(thursday) is True
    assert course.is_session_date(friday) is False
    assert course.is_session_date(saturday) is False
    assert course.is_session_date(sunday) is False


def test_has_label():
    course = Course.make(days=[0], label='Arm Wrestling with Sarah')

    assert course.label == 'Arm Wrestling with Sarah'


def test_stringifies_to_label():
    course = Course.make(days=[0], label='Contemporary Dressmaking')

    assert str(course) == 'Contemporary Dressmaking'
