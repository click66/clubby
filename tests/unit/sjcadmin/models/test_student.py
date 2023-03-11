import datetime
import pytest

from sjcadmin.sjcauth.models import User
from sjcadmin.sjcadmin.models.course import Course
from sjcadmin.sjcadmin.models.student import Student, Profile, Note, Licence, Payment


def test_make_student_with_only_name():
    s = Student.make(name='John Doe')

    assert s.name is 'John Doe'


def test_make_student_with_only_profile():
    s = Student.make(profile=Profile(
        name='John Doe',
        dob='1991-10-15',
        phone='07555123456',
        email='text@example.com',
        address='123 Fake St. Springfield',
    ))

    assert s.name is 'John Doe'


def test_if_name_and_profile_passed_profile_name_used():
    s = Student.make(name='Major Zero', profile=Profile(
        name='Major Tom',
        dob='1991-10-15',
        phone='07555123456',
        email='text@example.com',
        address='123 Fake St. Portsmouth',
    ))

    assert s.name is 'Major Tom'


def test_update_profile():
    s = Student.make(profile=Profile(
        name='John Doe',
        dob='1991-10-15',
        phone='07555123456',
        email='text@example.com',
        address='123 Fake St. Springfield',
    ))

    s.set_profile(Profile(
        name='Jason Bourne',
        dob='1991-10-16',
        phone='07555654321',
        email='new@example.com',
        address='456 Real St. Portsmouth',
    ))

    assert s.name is 'Jason Bourne'
    assert s.dob is '1991-10-16'
    assert s.phone is '07555654321'
    assert s.email is 'new@example.com'
    assert s.address is '456 Real St. Portsmouth'


def test_add_profile():
    s = Student.make(name='John Doe')

    s.set_profile(Profile(
        name='Jason Bourne',
        dob='1991-10-16',
        phone='07555654321',
        email='new@example.com',
        address='456 Real St. Portsmouth',
    ))

    assert s.name is 'Jason Bourne'
    assert s.dob is '1991-10-16'
    assert s.phone is '07555654321'
    assert s.email is 'new@example.com'
    assert s.address is '456 Real St. Portsmouth'


def test_read_student_remaining_trial_sessions():
    profile = Profile(
        name='John Doe',
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
        name='John Doe',
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
        Student.make(profile=Profile(dob='1991-10-15', phone='07555123456', email='test@example.com',
                                     address='123 Fake St. Springfield'))


def test_licence_expired():
    expired = Student.make(name='John Doe', licence=Licence(
        number=123456, expires=datetime.datetime(2019, 1, 1).date()))
    assert expired.is_licence_expired() is True

    not_expired = Student.make(name='John Doe', licence=Licence(
        number=123456, expires=datetime.datetime(2030, 1, 1).date()))
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
                               author=user.uuid,
                               datetime=now))

    notes = student.get_last_notes(3)
    assert notes[0].text == "I''m back from the future"
    assert notes[0].author == user.uuid
    assert notes[0].time == now


def test_recall_latest_note():
    user = User()
    user.username = 'joe.b'

    # Mock db object
    student = Student.make(name='John Doe')
    student._notes = [
        Note.make('Mid note', author=user,
                  datetime=datetime.datetime(2019, 1, 1)),
        Note.make('Latest note', author=user,
                  datetime=datetime.datetime(2022, 1, 1)),
        Note.make('Old note', author=user,
                  datetime=datetime.datetime(2015, 1, 1)),
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
    john.add_note(Note.make('Foobar', author=user,
                  datetime=datetime.datetime(2019, 1, 1)))

    assert john.has_notes is True
    assert joe.has_notes is False


def test_get_last_5_notes():
    user = User()
    user.username = 'joe.d'

    s = Student.make(name='John Doe')
    s.add_note(Note.make('Mid note', author=user,
               datetime=datetime.datetime(2019, 1, 1)))
    s.add_note(Note.make('Latest note', author=user,
               datetime=datetime.datetime(2022, 1, 1)))
    s.add_note(Note.make('Latest note', author=user,
               datetime=datetime.datetime(2022, 2, 1)))
    s.add_note(Note.make('Latest note', author=user,
               datetime=datetime.datetime(2022, 3, 1)))
    s.add_note(Note.make('Old note', author=user,
               datetime=datetime.datetime(2015, 1, 1)))
    s.add_note(Note.make('Old note', author=user,
               datetime=datetime.datetime(2015, 2, 1)))
    s.add_note(Note.make('Old note', author=user,
               datetime=datetime.datetime(2015, 3, 1)))

    notes = s.get_last_notes(5)

    assert s.has_more_than_n_notes(5) is True
    assert s.has_more_than_n_notes(10) is False

    assert len(notes) == 5


def test_has_user_paid_same_course():
    s = Student.make(name='John Doe')

    course = Course.make('Junior Course', [0, 3])

    s.take_payment(Payment.make(datetime.datetime(2022, 2, 1), course))

    assert s.has_prepaid(course) is not None


def test_has_use_paid_different_course():
    s = Student.make(name='John Doe')

    course1 = Course.make('Junior Course', [0, 3])
    course2 = Course.make('Adult Course', [0, 3])

    s.take_payment(Payment.make(datetime.datetime(2022, 2, 1), course1))

    assert s.has_prepaid(course2) is None


def test_student_signup_for_course():
    s = Student.make(name='John Doe')
    course = Course.make('TJJF Course', [0, 1])

    s.sign_up(course)

    assert s.courses[0].label == 'TJJF Course'


def test_handle_payment_without_course():
    # Given a student has a payment on their account that is not associated with a particular course
    # e.g. they may have paid for a course that is no longer running
    s = Student.make(name='John Doe')
    s.take_payment(Payment.make(datetime.datetime(2022, 2, 1), None))

    # When I query for unused payments for a different course
    course = Course.make('Another course', [0])
    result = s.get_unused_payments(course)

    # Then the payment is returned
    # (To avoid the student missing out, we count this payment as being redeemable for any course)
    assert len(result) is 1


def test_with_creator():
    creator_uuid = 'b5857ed4-2485-40b6-95e1-17f6481e36b7'
    s = Student.make(name='John Doe', creator=creator_uuid)

    assert s._creator is creator_uuid
