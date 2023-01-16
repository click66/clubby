from dataclasses import dataclass
from datetime import datetime
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from uuid import UUID, uuid4

from ..errors import *
from .course import Course


@dataclass(frozen=True)
class Profile:
    name: str
    dob: str
    phone: str
    email: str
    address: str


class Licence(models.Model):
    number = models.IntegerField()
    expires = models.DateField()


class Note(models.Model):
    _text = models.TextField(null=False, blank=True, db_column='text')
    _student = models.ForeignKey(
        'Student', on_delete=models.CASCADE, db_column='student_uuid')
    _datetime = models.DateTimeField(null=False, db_column='datetime')
    _author = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, db_column='author_id')

    @classmethod
    def make(cls, text, author: User, datetime: datetime):
        note = cls(_text=text, _author=author, _datetime=datetime)
        return note

    @property
    def text(self):
        return self._text

    @property
    def author_name(self):
        return self._author.username

    @property
    def time(self):
        return self._datetime

    @property
    def student_name(self):
        return self._student.name


class Payment(models.Model):
    _student = models.ForeignKey(
        'Student', null=True, on_delete=models.SET_NULL, db_column='student_uuid')
    _datetime = models.DateTimeField(null=False, db_column='datetime')
    _used = models.BooleanField(default=False, db_column='used')
    _course = models.ForeignKey(
        'Course', null=True, on_delete=models.SET_NULL, db_column='course_uuid')

    @classmethod
    def make(cls, datetime: datetime, course: Course):
        payment = cls(_datetime=datetime, _course=course)
        return payment

    def mark_used(self):
        self._used = True

    @property
    def used(self):
        return self._used

    @property
    def time(self):
        return self._datetime

    @property
    def course(self):
        return self._course


class Student(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    _creator = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, db_column='creator_id')

    profile_name = models.CharField(null=True, max_length=120)
    profile_dob = models.DateField(null=True)
    profile_phone = models.CharField(null=True, max_length=32)
    profile_email = models.EmailField(null=True)
    profile_address = models.TextField(blank=True, null=True)

    licence = models.OneToOneField(
        Licence, on_delete=models.SET_NULL, null=True, blank=True)
    allowed_trial_sessions = models.IntegerField()

    join_date = models.DateField(null=False, default=timezone.now)
    _courses = models.ManyToManyField(Course)

    _existing_courses = []
    _new_courses = []

    _notes = []
    _new_notes = []

    _used_payments = []
    _unused_payments = []
    _new_payments = []

    @classmethod
    def from_db(cls, db, field_names, values):
        r = super().from_db(db, field_names, values)

        r._notes = list(r.note_set.all())
        r._new_notes = []

        r._unused_payments = list(r.payment_set.filter(
            _used=False).order_by('-_datetime'))
        r._used_payments = list(r.payment_set.filter(
            _used=True).order_by('-_datetime'))
        r._new_payments = []

        r._existing_courses = list(r._courses.all())
        r._new_courses = []

        # Eager read Attendance object into Student object
        r.sessions_attended = r.attendance_set.count()
        return r

    def save(self, *args, **kwargs):
        for note in self._new_notes:
            note.save()
        self.note_set.add(*self._new_notes)

        for payment in self._new_payments:
            payment.save()
        self.payment_set.add(*self._new_payments)
        for payment in self._unused_payments:
            payment.save()

        if self.has_licence():
            self.licence.save()

        self._courses.add(*self._new_courses)

        super().save(*args, **kwargs)

    @classmethod
    def make(
            cls,
            name: str=None,
            profile=None,
            licence=None,
            creator: User=None,
    ):
        if not name and (not profile or (profile and not profile.name)):
            raise ValueError('Student name cannot be blank')

        student = cls(
            licence=licence,
            profile_name=profile.name if profile else name,
            profile_dob=getattr(profile, 'dob', None),
            profile_phone=getattr(profile, 'phone', None),
            profile_email=getattr(profile, 'email', None),
            profile_address=getattr(profile, 'address', None),
            allowed_trial_sessions=(0 if licence else 2),
            _creator=creator,
        )

        student.sessions_attended = 0
        student._notes = []
        student._new_notes = []
        student._new_courses = []

        return student

    def set_profile(self, profile: Profile):
        self.profile_name = profile.name
        self.profile_dob = profile.dob
        self.profile_phone = profile.phone
        self.profile_email = profile.email
        self.profile_address = profile.address

    @property
    def name(self) -> str:
        return self.profile_name

    @property
    def added_by(self) -> str | None:
        return self._creator.username if self._creator else None

    @property
    def dob(self) -> str:
        return self.profile_dob

    @property
    def phone(self) -> str:
        return self.profile_phone

    @property
    def email(self) -> str:
        return self.profile_email

    @property
    def address(self) -> str:
        return self.profile_address

    @property
    def courses(self) -> list[Course]:
        return self._existing_courses + self._new_courses

    @property
    def licence_no(self) -> int:
        return getattr(self.licence, 'number', None)

    @property
    def licence_expiry_date(self) -> str:
        return getattr(self.licence, 'expires', None)

    def has_licence(self) -> bool:
        return self.licence is not None

    def is_licence_expired(self) -> bool:
        return self.licence is not None and self.licence.expires < datetime.today().date()

    @property
    def remaining_trial_sessions(self) -> int:
        return self.allowed_trial_sessions - self.sessions_attended

    def add_licence(self, licence: Licence):
        self.licence = licence

    def add_note(self, note: Note):
        note._student = self
        self._new_notes.insert(0, note)

    def get_last_notes(self, n):
        return sorted(self._new_notes + self._notes, key=lambda x: x.time, reverse=True)[0:n]

    def has_more_than_n_notes(self, n):
        return (len(self._notes) + len(self._new_notes)) > n

    @property
    def has_notes(self):
        return self.has_more_than_n_notes(0)

    def get_unused_payments(self, course=None) -> list:
        return list(filter(lambda p: not p.used and (
            course is None or
            p.course is None or
            p.course == course
        ), self._unused_payments + self._new_payments))

    def has_prepaid(self, course):
        prepayments = self.get_unused_payments(course)
        return prepayments[0] if prepayments else None

    def take_payment(self, payment: Payment):
        payment._student = self
        self._new_payments.insert(0, payment)

    def get_last_payments(self, n):
        return sorted(self._used_payments, key=lambda x: x.time, reverse=True)[0:n]

    def sign_up(self, course):
        # self._courses.add(course)
        self._new_courses.append(course)
