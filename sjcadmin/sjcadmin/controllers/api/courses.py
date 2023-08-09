import json

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from datetime import date

from ._middleware import handle_error, login_required_401
from ...models.attendance import Attendance
from ...models.course import Course


@login_required_401
@require_http_methods(['POST'])
@handle_error
def post_add_course(request):
    data = json.loads(request.body)
    c = Course.make(label=data.get('courseName'), days=data.get('courseDay'))
    c.save()

    return JsonResponse({'success': {'uuid': c.uuid}})


@login_required_401
@require_http_methods(['POST'])
@handle_error
def post_delete_course(request, pk):
    c = Course.fetch_by_uuid(pk)

    if c:
        Attendance.objects.filter(_course=c).delete()

    c.delete()

    return JsonResponse({'success': {'uuid': c.uuid}})
