import json
from datetime import date
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pydantic import BaseModel
from typing import Literal, Optional
from uuid import UUID

from ...models import Attendance as AttendanceModel, Resolution as ResolutionModel


class AttendanceQuery(BaseModel):
    student_uuids: list[UUID]
    course_uuid: UUID
    date: date


class Attendance(BaseModel):
    student_uuid: UUID
    resolution: Optional[Literal['paid', 'comp']] = None


class AttendancePost(Attendance):
    course_uuid: UUID
    date: date


@require_http_methods(['GET', 'PUT'])
@csrf_exempt
def dispatch(request):
    match request.method:
        case 'GET':
            return get_attendance(request)
        case 'PUT':
            return put_attendance(request)


def get_attendance(request):
    def resolution(attendance: Attendance):
        match True:
            case attendance.paid:
                return 'paid'
            case attendance.complementary:
                return 'comp'

        return None

    query = AttendanceQuery(student_uuids=request.GET.getlist('student[]'),
                            course_uuid=request.GET.get('course'),
                            date=request.GET.get('date'))

    results = AttendanceModel.objects.filter(student_uuid__in=query.student_uuids,
                                             course_uuid=query.course_uuid,
                                             date=query.date).select_related('resolution')

    response = list(map(lambda a: Attendance(student_uuid=a.student_uuid,
                                             resolution=resolution(a)).model_dump_json(), results))

    return JsonResponse({'attendances': response})


def put_attendance(request):
    data = json.loads(request.body)
    post = AttendancePost(course_uuid=data.get('course_uuid'),
                          date=data.get('date'),
                          student_uuid=data.get('student_uuid'),
                          resolution=data.get('resolution', None))

    create = AttendanceModel.make(date=post.date,
                                  course_uuid=post.course_uuid,
                                  student_uuid=post.student_uuid)

    match(post.resolution):
        case 'paid':
            create.set_resolution(ResolutionModel.make(paid=True))
        case 'comp':
            create.set_resolution(ResolutionModel.make(complementary=True))

    create.save()

    return HttpResponse(status=204)
