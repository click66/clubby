import datetime
import pytest

from django.contrib.auth.models import User
from sjcadmin.models.student import Student, Profile, Note, Licence


def test_make_student_with_only_name():
    Student.make(name='John Doe')


def test_read_student_remaining_trial_sessions():
    profile = Profile(
        dob='1991-10-15',
        phone='07555123456',
        email='test@example.com',
        address='123 Fake St. Springfield',
    )

    student = Student.make(name='John Doe', profile=profile)

    assert student.name == 'John Doe'
    assert student.dob == '1991-10-15'
    assert student.phone == '07555123456'
    assert student.email == 'test@example.com'
    assert student.address == '123 Fake St. Springfield'
    assert student.licence_no is None


def test_default_remaining_trial_sessions_is_two():
    student = Student.make(name='John Doe', profile=Profile(
        dob='1991-10-15',
        phone='07555123456',
        email='test@example.com',
        address='123 Fake St. Springfield',
    ))

    assert student.remaining_trial_sessions == 2


def test_licenced_student_has_no_trial_sessions():
    student = Student.make(name='John Doe', licence=Licence(number=123456,
                                                            expires=datetime.datetime(2019, 1, 1).date()))

    assert student.remaining_trial_sessions == 0


def test_student_must_have_name():
    with pytest.raises(TypeError):
        Student.make(profile=Profile(dob='1991-10-15', phone='07555123456', email='test@example.com',#
                                     address='123 Fake St. Springfield'))


def test_licence_expired():
    expired = Student.make(name='John Doe', licence=Licence(number=123456, expires=datetime.datetime(2019, 1, 1).date()))
    assert expired.is_licence_expired() is True

    not_expired = Student.make(name='John Doe', licence=Licence(number=123456, expires=datetime.datetime(2030, 1, 1).date()))
    assert not_expired.is_licence_expired() is False


def test_student_name_cannot_be_blank():
    with pytest.raises(ValueError):
        Student.make(name='')


def test_add_note():
    now = datetime.datetime.now()
    student = Student.make(name='John Doe')
    user = User()
    user.username = 'joe.b'

    student.add_note(Note.make("I''m back from the future",
                               author=user,
                               datetime=now))

    notes = student.get_last_notes(3)
    assert notes[0].text == "I''m back from the future"
    assert notes[0].author_name == 'joe.b'
    assert notes[0].time == now


def test_recall_latest_note():
    user = User()
    user.username = 'joe.b'
    
    # Mock db object
    student = Student.make(name='John Doe')
    student._notes = [
        Note.make('Mid note', author=user, datetime=datetime.datetime(2019, 1, 1)),
        Note.make('Latest note', author=user, datetime=datetime.datetime(2022, 1, 1)),
        Note.make('Old note', author=user, datetime=datetime.datetime(2015, 1, 1)),
    ]

    got_notes = student.get_last_notes(3)
    assert got_notes[0].text == 'Latest note'
    assert got_notes[1].text == 'Mid note'
    assert got_notes[2].text == 'Old note'


def test_notes_multiple_students():
    user = User()
    user.username = 'joe.c'

    john = Student.make(name='John Doe')
    joe = Student.make(name='Joe Bloggs')
    john.add_note(Note.make('Foobar', author=user, datetime=datetime.datetime(2019, 1, 1)))

    assert john.has_notes is True
    assert joe.has_notes is False


def test_get_last_5_notes():
    user = User()
    user.username = 'joe.d'

    s = Student.make(name='John Doe')
    s.add_note(Note.make('Mid note', author=user, datetime=datetime.datetime(2019, 1, 1)))
    s.add_note(Note.make('Latest note', author=user, datetime=datetime.datetime(2022, 1, 1)))
    s.add_note(Note.make('Latest note', author=user, datetime=datetime.datetime(2022, 2, 1)))
    s.add_note(Note.make('Latest note', author=user, datetime=datetime.datetime(2022, 3, 1)))
    s.add_note(Note.make('Old note', author=user, datetime=datetime.datetime(2015, 1, 1)))
    s.add_note(Note.make('Old note', author=user, datetime=datetime.datetime(2015, 2, 1)))
    s.add_note(Note.make('Old note', author=user, datetime=datetime.datetime(2015, 3, 1)))

    notes = s.get_last_notes(5)

    assert s.has_more_than_n_notes(5) is True
    assert s.has_more_than_n_notes(10) is False

    assert len(notes) == 5
