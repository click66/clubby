from datetime import date
from pydantic import BaseModel, BeforeValidator
from typing import Annotated, Literal, Optional
from uuid import UUID


class AttendanceQuery(BaseModel):
    student_uuids: list[UUID]
    course_uuid: UUID
    date_earliest: date
    date_latest: date


class AttendanceBase(BaseModel):
    student_uuid: UUID
    course_uuid: UUID
    date: date


class AttendancePost(AttendanceBase):
    resolution: Optional[Literal['paid', 'comp']] = None
    use_advanced_payment: Optional[bool] = False


class AttendanceRead(AttendanceBase):
    resolution: Annotated[Optional[Literal['paid', 'comp']],
                          BeforeValidator(lambda x: x.type if x else x)] = None
    id: int
