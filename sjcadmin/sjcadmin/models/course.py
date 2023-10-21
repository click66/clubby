from datetime import datetime
from django.contrib.postgres.fields import ArrayField
from django.db import models
from uuid import uuid4

from ..errors import *


class Course(models.Model):
    _uuid = models.UUIDField(
        primary_key=True, default=uuid4, editable=False, db_column='uuid')
    _label = models.CharField(null=True, max_length=30, db_column='label')
    dates = ArrayField(models.DateField(), default=list)
    _days = ArrayField(
        models.IntegerField(),
        size=7,
        db_column='days',
    )
    tenant_uuid = models.UUIDField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['tenant_uuid'])
        ]

    @classmethod
    def fetch_all(cls):
        return cls.objects.all()

    @classmethod
    def fetch_by_uuid(cls, uuid, tenant_uuid):
        return cls.objects.get(pk=uuid, tenant_uuid=tenant_uuid)

    def __str__(self):
        return self._label

    @classmethod
    def make(cls, label: str, days: list[int], dates: list[datetime.date]):
        return cls(
            _label=label,
            _days=days,
            dates=dates,
        )

    @property
    def uuid(self):
        return self._uuid

    @property
    def label(self):
        return self._label

    @property
    def days(self):
        return self._days

    def is_session_date(self, d: datetime):
        return d in self.dates or d.weekday() in self._days

    def has_future_dates(self, today: datetime) -> bool:
        return self._days or any(d > today for d in self.dates)
