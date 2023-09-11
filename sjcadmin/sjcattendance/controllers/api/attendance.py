import json
from datetime import date
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pydantic import BaseModel
from typing import Literal, Optional
from uuid import UUID

from ._middleware import handle_error
from ...models import Attendance as AttendanceModel, Resolution as ResolutionModel


class AttendanceQuery(BaseModel):
    student_uuids: list[UUID]
    course_uuid: UUID
    date_earliest: date
    date_latest: date


class AttendanceBase(BaseModel):
    student_uuid: UUID
    resolution: Optional[Literal['paid', 'comp']] = None
    course_uuid: UUID
    date: date


class AttendancePost(AttendanceBase):
    pass


class AttendanceRead(AttendanceBase):
    id: int


@require_http_methods(['GET', 'POST'])
@csrf_exempt
def dispatch(request):
    match request.method:
        case 'GET':
            return get_attendance(request)
        case 'POST':
            return post_attendance(request)


def get_attendance(request):
    def resolution(attendance: AttendanceRead):
        match True:
            case attendance.paid:
                return 'paid'
            case attendance.complementary:
                return 'comp'

        return None

    query = AttendanceQuery(student_uuids=request.GET.getlist('student[]'),
                            course_uuid=request.GET.get('course'),
                            date_earliest=request.GET.get('date_earliest'),
                            date_latest=request.GET.get('date_latest'))

    results = AttendanceModel.objects.filter(student_uuid__in=query.student_uuids,
                                             course_uuid=query.course_uuid,
                                             date__gte=query.date_earliest,
                                             date__lte=query.date_latest).select_related('resolution')

    response = list(map(lambda a: dict(AttendanceRead(id=a.pk,
                                                      student_uuid=a.student_uuid,
                                                      course_uuid=a.course_uuid,
                                                      date=a.date,
                                                      resolution=resolution(a))), results))

    return JsonResponse({'attendances': response})


def post_attendance(request):
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


@require_http_methods(['DELETE'])
@csrf_exempt
@handle_error
def delete_attendance(request, pk: int):
    try:
        AttendanceModel.objects.get(pk=pk).delete()
        return HttpResponse(status=204)
    except ObjectDoesNotExist:
        return HttpResponse(status=404)


@require_http_methods(['POST'])
@csrf_exempt
@handle_error
def delete_by_criteria(request):
    data = json.loads(request.body)

    query = AttendanceQuery(course_uuid=data.get('course_uuid'),
                            date_earliest=data.get('date'),
                            date_latest=data.get('date'),
                            student_uuids=[data.get('student_uuid')])

    AttendanceModel.objects.filter(student_uuid__in=query.student_uuids,
                                   course_uuid=query.course_uuid,
                                   date__gte=query.date_earliest,
                                   date__lte=query.date_latest).select_related('resolution').delete()

    return HttpResponse(status=204)
