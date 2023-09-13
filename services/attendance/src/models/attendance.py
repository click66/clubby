from datetime import date
from sqlalchemy import ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from typing import Optional
from uuid import UUID

from ..errors import InvalidResolutionError


class Base(DeclarativeBase):
    pass


class Resolution(Base):
    __tablename__ = 'sjcattendance_resolution'

    id: Mapped[int] = mapped_column(primary_key=True)
    paid: Mapped[bool] = mapped_column(default=False)
    complementary: Mapped[bool] = mapped_column(default=False)

    attendance: Mapped['Attendance'] = relationship(
        back_populates='resolution')
    
    def __init__(self, paid: bool = False, complementary: bool = False):
        if paid and complementary:
            raise InvalidResolutionError('Resolution cannot be both paid and complementary')

        self.paid = paid
        self.complementary = complementary

    @property
    def type(self):
        match True:
            case self.paid:
                return 'paid'
            case self.complementary:
                return 'comp'


class Attendance(Base):
    __tablename__ = 'sjcattendance_attendance'

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[date]
    course_uuid: Mapped[UUID]
    student_uuid: Mapped[UUID]
    resolution_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('sjcattendance_resolution.id'), name='resolution')

    resolution: Mapped[Optional['Resolution']] = relationship(
        back_populates='attendance')
