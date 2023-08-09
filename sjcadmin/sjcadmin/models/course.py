from datetime import datetime
from django.contrib.postgres.fields import ArrayField
from django.db import models
from uuid import uuid4

from ..errors import *


class Course(models.Model):
    _uuid = models.UUIDField(primary_key=True, default=uuid4, editable=False, db_column='uuid')
    _label = models.CharField(null=True, max_length=30, db_column='label')
    _days = ArrayField(
        models.IntegerField(),
        size=7,
        db_column='days',
    )
    
    @classmethod
    def fetch_all(cls):
        return cls.objects.all()

    @classmethod
    def fetch_by_uuid(cls, uuid):
        return cls.objects.get(pk=uuid)

    def __str__(self):
        return self._label

    @classmethod
    def make(cls, label: str, days: list[int]):
        return cls(
            _label=label,
            _days=days,
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
        return d.weekday() in self._days
