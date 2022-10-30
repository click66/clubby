import datetime
import pytest

from sjcadmin.models.student import Student, Profile, Licence


def test_read_student_remaining_trial_sessions():
    profile = Profile(
        name='John Doe',
        dob='1991-10-15',
        phone='07555123456',
        email='test@example.com',
        address='123 Fake St. Springfield',
    )

    student = Student.make(profile=profile)

    assert student.name == 'John Doe'
    assert student.dob == '1991-10-15'
    assert student.phone == '07555123456'
    assert student.email == 'test@example.com'
    assert student.address == '123 Fake St. Springfield'
    assert student.licence_no is None


def test_default_remaining_trial_sessions_is_two():
    student = Student.make(profile=Profile(
        name='John Doe',
        dob='1991-10-15',
        phone='07555123456',
        email='test@example.com',
        address='123 Fake St. Springfield',
    ))

    assert student.remaining_trial_sessions == 2


def test_licenced_student_has_no_trial_sessions():
    student = Student.make(licence=Licence(number=123456, expires=datetime.datetime(2019, 1, 1).date()))

    assert student.remaining_trial_sessions == 0


def test_student_must_have_licence_profile():
    with pytest.raises(ValueError):
        Student.make()


def test_licence_expired():
    expired = Student.make(licence=Licence(number=123456, expires=datetime.datetime(2019, 1, 1).date()))
    assert expired.is_licence_expired() is True

    not_expired = Student.make(licence=Licence(number=123456, expires=datetime.datetime(2030, 1, 1).date()))
    assert not_expired.is_licence_expired() is False


def test_adding_licence_clears_profile():
    student = Student.make(profile=Profile(
        name='John Doe',
        dob='1991-10-15',
        phone='07555123456',
        email='test@example.com',
        address='123 Fake St. Springfield',
    ))

    assert student.licence_no is None
    assert student.name == 'John Doe'

    student.add_licence(Licence(number=123456, expires=datetime.datetime(2033, 2, 2)))

    assert student.licence_no == 123456
    assert student.name is None
    assert student.dob is None
    assert student.phone is None
    assert student.email is None
    assert student.address is None
