from dataclasses import dataclass
from datetime import datetime
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
import uuid

from ..errors import *


@dataclass(frozen=True)
class Profile:
    dob: str
    phone: str
    email: str
    address: str


class Licence(models.Model):
    number = models.IntegerField()
    expires = models.DateField()


class Note(models.Model):
    _text = models.TextField(null=False, blank=True, db_column='text')
    _student = models.ForeignKey('Student', on_delete=models.CASCADE, db_column='student_uuid')
    _datetime = models.DateTimeField(null=False, db_column='datetime')
    _author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, db_column='author_id')

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


class Student(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    profile_name = models.CharField(null=True, max_length=120)
    profile_dob = models.DateField(null=True)
    profile_phone = models.CharField(null=True, max_length=32)
    profile_email = models.EmailField(null=True)
    profile_address = models.TextField(blank=True, null=True)

    licence = models.OneToOneField(Licence, on_delete=models.SET_NULL, null=True, blank=True)
    allowed_trial_sessions = models.IntegerField()

    join_date = models.DateField(null=False, default=timezone.now)

    _notes = []
    _new_notes = []

    @classmethod
    def from_db(cls, db, field_names, values):
        r = super().from_db(db, field_names, values)
        r._notes = list(r.note_set.all())
        r._new_notes = []
        # Eager read Attendance object into Student object
        r.sessions_attended = r.attendance_set.count()
        return r

    def save(self, *args, **kwargs):
        for note in self._new_notes:
            note.save()
        self.note_set.add(*self._new_notes)

        if self.has_licence():
            self.licence.save()

        super().save(*args, **kwargs)

    @classmethod
    def make(
            cls,
            name: str,
            profile=None,
            licence=None,
    ):
        if name == '':
            raise ValueError('Student name cannot be blank')

        student = cls(
            licence=licence,
            profile_name=name,
            profile_dob=getattr(profile, 'dob', None),
            profile_phone=getattr(profile, 'phone', None),
            profile_email=getattr(profile, 'email', None),
            profile_address=getattr(profile, 'address', None),
            allowed_trial_sessions=(0 if licence else 2)
        )

        student.sessions_attended = 0
        student._notes = []
        student._new_notes = []

        return student

    @property
    def name(self) -> str:
        return self.profile_name

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
