from dataclasses import dataclass
from datetime import datetime, date
from django.db import models
from ...sjcauth.models import User
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
    _author = models.UUIDField(null=True, db_column='author_id')

    @classmethod
    def make(cls, text, author: UUID, datetime: datetime):
        note = cls(_text=text, _author=author, _datetime=datetime)
        return note

    @property
    def text(self):
        return self._text

    @property
    def author(self):
        return self._author

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

    def can_pay_for(self, course: Course):
        return course.uuid == self._course.uuid


class Subscription(models.Model):
    student = models.ForeignKey(
        'Student', null=False, on_delete=models.CASCADE)
    expiry_date = models.DateField(null=True)
    type = models.TextField(blank=False, null=False, default='time')
    course = models.ForeignKey('Course', null=True, on_delete=models.CASCADE)

    @classmethod
    def make(cls, type: str, expiry_date: datetime, course: Course):
        subscription = cls(expiry_date=expiry_date, course=course, type=type)
        return subscription


class Student(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    _creator = models.UUIDField(null=True, db_column='creator_id')
    _creator_name = models.TextField(null=True, max_length=120)
    tenant_uuid = models.UUIDField(null=True, blank=True)

    active = models.BooleanField(default=True)

    profile_name = models.CharField(null=True, max_length=120)
    profile_dob = models.DateField(null=True)
    profile_phone = models.CharField(null=True, max_length=32)
    profile_email = models.EmailField(null=True)
    profile_address = models.TextField(blank=True, null=True)

    licence = models.OneToOneField(
        Licence, on_delete=models.SET_NULL, null=True, blank=True)
    allowed_trial_sessions = models.IntegerField()

    join_date = models.DateField(null=False, default=date.today)

    _sessions_attended = 0

    _courses = models.ManyToManyField(Course)

    _existing_courses = []
    _new_courses = []
    _removed_courses = []

    _notes = []
    _new_notes = []

    _used_payments = []
    _unused_payments = []
    _new_payments = []
    _unused_and_new_payments = []
    _new_subscriptions = []

    @classmethod
    def fetch_all(cls, tenant_uuid: str):
        objects = cls.objects\
            .select_related('licence')\
            .prefetch_related('note_set')\
            .prefetch_related('payment_set')\
            .prefetch_related('subscription_set')\
            .prefetch_related('attendance_set')\
            .prefetch_related('_courses')\
            .filter(tenant_uuid=tenant_uuid)

        for o in objects:
            payments = o.payment_set.all().order_by('-_datetime')
            o._unused_payments = [p for p in payments if not p.used]
            o._used_payments = [p for p in payments if p.used]
            o._new_payments = []
            o._unused_and_new_payments = o._unused_payments

            o._sessions_attended = o.attendance_set.count()

            o._notes = list(o.note_set.all())
            o._new_notes = []

            o._existing_courses = list(o._courses.all())
            o._new_courses = []
            o._removed_courses = []

        return objects

    @classmethod
    def fetch_by_uuid(cls, uuid: str, tenant_uuid: str = None):
        o = cls.objects.get(
            pk=uuid, tenant_uuid=tenant_uuid) if tenant_uuid else cls.objects.get(pk=uuid)

        o._unused_payments = list(o.payment_set.filter(
            _used=False).order_by('-_datetime'))
        o._used_payments = list(o.payment_set.filter(
            _used=True).order_by('-_datetime'))
        o._new_payments = []
        o._unused_and_new_payments = o._unused_payments

        o._sessions_attended = o.attendance_set.count()

        o._notes = list(o.note_set.all())
        o._new_notes = []

        o._existing_courses = list(o._courses.all())
        o._new_courses = []
        o._removed_courses = []

        o._new_subscriptions = []

        return o

    @classmethod
    def fetch_signed_up_for(cls, course: Course, tenant_uuid: str):
        return course.student_set.all()

    @classmethod
    def fetch_signed_up_for_multiple(cls, course_uuids: list[str], tenant_uuid: str):
        objects = cls.objects\
            .select_related('licence')\
            .prefetch_related('note_set')\
            .prefetch_related(models.Prefetch('payment_set', queryset=Payment.objects.order_by('-_datetime')))\
            .annotate(_sessions_attended=models.Count('attendance'))\
            .prefetch_related('_courses')\
            .all().filter(_courses__in=course_uuids)

        for o in objects:
            payments = o.payment_set.all()
            o._unused_payments = [p for p in payments if not p.used]
            o._used_payments = [p for p in payments if p.used]
            o._new_payments = []
            o._unused_and_new_payments = o._unused_payments

            o._notes = list(o.note_set.all())
            o._new_notes = []

            o._existing_courses = list(o._courses.all())
            o._new_courses = []
            o._removed_courses = []

        return objects

    @classmethod
    def fetch_query(cls, course_uuids: list[str] = None, user: User = None, tenant_uuid: str = None):
        queryset = cls.objects\
            .select_related('licence')\
            .prefetch_related('note_set')\
            .prefetch_related(models.Prefetch('payment_set', queryset=Payment.objects.order_by('-_datetime')))\
            .prefetch_related('subscription_set')\
            .annotate(_sessions_attended=models.Count('attendance'))\
            .prefetch_related('_courses')\
            .all()

        if course_uuids:
            queryset = queryset.filter(_courses__in=course_uuids)

        if tenant_uuid:
            queryset = queryset.filter(tenant_uuid=tenant_uuid)

        if user:
            queryset = queryset.filter(profile_email=user.email)

        for o in queryset:
            payments = o.payment_set.all()
            o._unused_payments = [p for p in payments if not p.used]
            o._used_payments = [p for p in payments if p.used]
            o._new_payments = []
            o._unused_and_new_payments = o._unused_payments

            o._notes = list(o.note_set.all())
            o._new_notes = []

            o._existing_courses = list(o._courses.all())
            o._new_courses = []
            o._removed_courses = []

        return queryset

    @classmethod
    def make(
            cls,
            name: str = None,
            profile=None,
            licence=None,
            creator: User = None,
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
            _creator=creator.uuid,
            _creator_name=creator.email
        )

        student._sessions_attended = 0
        student._notes = []
        student._new_notes = []
        student._new_courses = []
        student._removed_courses = []
        student._new_subscriptions = []
        student._new_payments = []

        return student

    def save(self, *args, **kwargs):
        for note in self._new_notes:
            note.save()
        self.note_set.add(*self._new_notes)

        for payment in self._new_payments:
            payment.save()
        self.payment_set.add(*self._new_payments)
        self._new_payments = []

        for payment in self._unused_payments:
            payment.save()

        for subscription in self._new_subscriptions:
            subscription.save()
        self.subscription_set.add(*self._new_subscriptions)
        self._new_subscriptions = []

        if self.has_licence():
            self.licence.save()

        self._courses.add(*self._new_courses)
        # for c in self._removed_courses:
        #     self._courses.remove(c)

        super().save(*args, **kwargs)

    def set_profile(self, profile: Profile):
        self.profile_name = profile.name
        self.profile_dob = profile.dob
        self.profile_phone = profile.phone
        self.profile_email = profile.email
        self.profile_address = profile.address

    def is_user(self, user: User) -> bool:
        return user.email == self.email

    @property
    def name(self) -> str:
        return self.profile_name

    @property
    def added_by(self) -> str | None:
        return self._creator_name

    @property
    def dob(self) -> str:
        return self.profile_dob

    @property
    def date_of_birth(self) -> str:
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
        return self.allowed_trial_sessions - self._sessions_attended

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
            p.can_pay_for(course)
        ), self._unused_and_new_payments))

    def has_prepaid(self, course):
        prepayments = self.get_unused_payments(course)
        return prepayments[0] if prepayments else None

    def take_payment(self, payment: Payment):
        payment._student = self
        self._new_payments.insert(0, payment)
        self._unused_and_new_payments.insert(0, payment)

    def has_subscription(self, course, date: date) -> bool:
        return any(subscription.course.uuid == course.uuid and subscription.expiry_date > date for subscription in self.subscription_set.all())

    def get_unexpired_subscriptions(self, date: date) -> list:
        return self.subscription_set.filter(expiry_date__gt=date)

    def subscribe(self, subscription: Subscription):
        subscription.student = self
        self._new_subscriptions.insert(0, subscription)

    def get_last_payments(self, n):
        return sorted(self._used_payments, key=lambda x: x.time, reverse=True)[0:n]

    def sign_up(self, course):
        self._new_courses.append(course)

    def unsign_up(self, course):
        self._removed_courses.append(course)

    def increment_attendance(self):
        self._sessions_attended += 1

    def decrement_attendance(self, count: int):
        self._sessions_attended -= count
