from collections.abc import Iterable
from datetime import date
from django.db import models
from uuid import UUID

from ..errors import *


class Resolution(models.Model):
    paid = models.BooleanField(default=False, null=False, db_column='paid')
    complementary = models.BooleanField(
        default=False, null=False, db_column='complementary')

    @classmethod
    def make(cls, paid: bool = False, complementary: bool = False):
        if paid and complementary:
            raise InvalidAttendanceResolution(
                'Attendance cannot be both paid and complementary')

        return cls(paid=paid, complementary=complementary)


class Attendance(models.Model):
    resolution = models.OneToOneField(
        Resolution, null=True, blank=True, on_delete=models.CASCADE, db_column='resolution')
    date = models.DateField(null=False, db_column='date', db_index=True)
    course_uuid = models.UUIDField(null=False, db_column='course_uuid', db_index=True)
    student_uuid = models.UUIDField(null=False, db_column='student_uuid', db_index=True)

    def save(self, *args, **kwargs) -> None:
        Attendance.objects.filter(date=self.date,
                            course_uuid=self.course_uuid,
                            student_uuid=self.student_uuid).delete()
        
        if (self.resolution):
            self.resolution.save()

        return super().save(*args, **kwargs)

    @classmethod
    def make(cls, date: date, course_uuid: UUID, student_uuid: UUID):
        return cls(date=date, course_uuid=course_uuid, student_uuid=student_uuid)

    @property
    def paid(self):
        return False if not self.resolution else self.resolution.paid

    @property
    def complementary(self):
        return False if not self.resolution else self.resolution.complementary

    def set_resolution(self, resolution: Resolution):
        self.resolution = resolution
