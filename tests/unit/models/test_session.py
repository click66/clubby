from datetime import datetime
import pytest

from sjcadmin.models.session import Session
from sjcadmin.models.course import Course


def test_get_next_session():
    # Given today is Tuesday Jan 1st 2019
    today=datetime(2019, 1, 1).date()

    # And the sessions take place every Thursday
    type = Course.make(label='Woeful Session', days=[3])

    # When I generate the next session
    session = Session.gen_next(start=today, course=type)

    # I get Thursday Jan 3rd 2019
    assert session.date == datetime(2019, 1, 3).date()


def test_session_generation():
    pass


def test_gen_two_sessions_same_day_exclusive_false():
    today = datetime(2022, 12, 26).date()
    one_week_ago = datetime(2022, 12, 19).date()

    course_one = Course.make(label='Monday and Thursday', days=[0, 3])
    course_two = Course.make(label='Thursday and Sunday', days=[3, 7])

    classes = Session.gen(one_week_ago, today, courses=[course_one, course_two])

    assert len(classes) is 4


def test_gen_two_sessions_same_day_exclusive_true():
    today = datetime(2022, 12, 26).date()
    one_week_ago = datetime(2022, 12, 19).date()

    course_one = Course.make(label='Monday and Thursday', days=[0, 3])
    course_two = Course.make(label='Thursday and Sunday', days=[3, 7])

    classes = Session.gen(one_week_ago, today, courses=[course_one, course_two], exclusive=True)

    assert len(classes) is 3
