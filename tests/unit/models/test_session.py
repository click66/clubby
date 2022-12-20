import datetime
import pytest

from sjcadmin.models.session import Session, Type


def test_get_next_session():
    # Given today is Tuesday Jan 1st 2019
    today=datetime.datetime(2019, 1, 1).date()

    # And the sessions take place every Thursday
    type = Type.make('Woeful Session', lambda d: d.weekday() == 3)

    # When I generate the next session
    session = Session.gen_next(start=today, type=type)

    # I get Thursday Jan 3rd 2019
    assert session.date == datetime.datetime(2019, 1, 3).date()
