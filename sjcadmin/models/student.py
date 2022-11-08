from dataclasses import dataclass
from datetime import datetime
from django.db import models
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


class Student(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    profile_name = models.CharField(null=True, max_length=120)
    profile_dob = models.DateField(null=True)
    profile_phone = models.CharField(null=True, max_length=32)
    profile_email = models.EmailField(null=True)
    profile_address = models.TextField(blank=True, null=True)

    licence = models.OneToOneField(Licence, on_delete=models.SET_NULL, null=True, blank=True)
    allowed_trial_sessions = models.IntegerField()

    sessions_attended = 0

    @classmethod
    def from_db(cls, db, field_names, values):
        r = super().from_db(db, field_names, values)
        # Eager read Attendance object into Student object
        r.sessions_attended = r.attendance_set.count()
        return r

    def save(self, *args, **kwargs):
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
