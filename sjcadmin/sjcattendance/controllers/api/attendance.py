from datetime import date, datetime
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from pydantic import BaseModel, Field
from typing import Literal, Union
from typing_extensions import Annotated
from uuid import UUID


class AttendanceQuery(BaseModel):
    student_uuids: list[UUID]
    course_uuid: UUID
    date: date


class StatusBase(BaseModel):
    resolved: bool = False


class StatusPaid(StatusBase):
    status_type: Literal['paid']
    resolved: bool = True


class StatusComplementary(StatusBase):
    status_type: Literal['comp']
    resolved: bool = True


class StatusAttending(StatusBase):
    status_type: Literal['attending']
    resolved: bool = False


Status = Annotated[Union[StatusPaid, StatusComplementary,
                         StatusAttending], Field(discriminator='status_type')]


class Attendance(BaseModel):
    student_uuid: UUID
    status: Status


def get_attendance_for_student_for_course_for_date(student_uuid: UUID, course_uuid: UUID, date: date):
    return Attendance(student_uuid=student_uuid,
                      status=StatusPaid(status_type='paid'))


@require_http_methods(['GET'])
def get_attendance(request):
    query = AttendanceQuery(student_uuids=request.GET.getlist('student[]'),
                            course_uuid=request.GET.get('course'),
                            date=request.GET.get('date'),
                            )

    response = []
    for uuid in query.student_uuids:
        attendance = get_attendance_for_student_for_course_for_date(
            student_uuid=uuid, course_uuid=query.course_uuid, date=query.date)
        if (attendance):
            response.append({
                'student_uuid': attendance.student_uuid,
                'status': attendance.status.dict(),
            })

    return JsonResponse(response, safe=False)
