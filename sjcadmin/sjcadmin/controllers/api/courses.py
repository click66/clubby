import json

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from datetime import date

from ._middleware import handle_error, login_required_401, role_required
from ...models.attendance import Attendance
from ...models.course import Course
from ...models.session import Session


@login_required_401
@role_required(['staff'])
@require_http_methods(['POST'])
@handle_error
def post_add_course(request):
    data = json.loads(request.body)
    c = Course.make(label=data.get('courseName'), days=data.get('courseDay'))
    c.tenant_uuid = request.user.tenant_uuid
    c.save()

    return JsonResponse({'success': {
        'uuid': c.uuid,
        'label': c.label,
        'days': c.days,
        'next_session_date': 'Unknown',
    }})


@login_required_401
@role_required(['staff'])
@require_http_methods(['POST'])
@handle_error
def post_delete_course(request, pk):
    c = Course.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)

    if c:
        Attendance.objects.filter(_course=c).delete()

    c.delete()

    return JsonResponse({'success': {'uuid': c.uuid}})


@login_required_401
@role_required(['staff'])
@require_http_methods(['GET'])
@handle_error
def get_courses(request):
    return JsonResponse(list(map(lambda c: {
        'uuid': c.uuid,
        'label': c.label,
        'days': c.days,
        'next_session_date': Session.gen_next(date.today(), c).date,
    }, Course.objects.filter(_days__len__gt=0, tenant_uuid=request.user.tenant_uuid))), safe=False)


@login_required_401
@role_required(['staff'])
@require_http_methods(['GET'])
@handle_error
def get_course(request, pk):
    c = Course.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)

    if not c:
        return JsonResponse({
            'status_code': 404,
            'error': 'Course not found'
        })

    return JsonResponse({
        'uuid': c.uuid,
        'label': c.label,
        'days': c.days,
        'next_session_date': Session.gen_next(date.today(), c).date,
    })
