from datetime import date
from pydantic import BaseModel, ConfigDict, BeforeValidator
from pydantic.alias_generators import to_camel

from typing import Annotated, Literal, Optional
from uuid import UUID


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name = True)


class AttendanceQuery(CamelModel):
    member_uuids: list[UUID]
    course_uuid: UUID
    date_earliest: date
    date_latest: date


class AttendanceBase(CamelModel):
    member_uuid: UUID
    course_uuid: UUID
    date: date


class AttendancePost(AttendanceBase):
    resolution: Optional[Literal['paid', 'comp']] = None
    use_advanced_payment: Optional[bool] = False


class AttendanceRead(AttendanceBase):
    resolution: Annotated[Optional[Literal['paid', 'comp']],
                          BeforeValidator(lambda x: x.type if x else x)] = None
    id: int
