from functools import wraps
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from datetime import date, timedelta
from ..errors import DomainError
from ..models.attendance import Attendance
from ..models.session import Session
from ..models.student import Student


def user_passes_test(test_func):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if test_func(request.user):
                return view_func(request, *args, **kwargs)
            return HttpResponse('Unauthorized', status=401)

        return _wrapped_view

    return decorator


def login_required_401(function=None):
    actual_decorator = user_passes_test(
        lambda u: u.is_authenticated,
    )
    if function:
        return actual_decorator(function)
    return actual_decorator


def handle_error(function=None):
    @wraps(function)
    def inner(request, *args, **kwargs):
        try:
            return function(request, *args, **kwargs)
        except DomainError as e:
            return JsonResponse({'error': str(e)})

    return inner


@login_required_401
@require_http_methods(['GET'])
def get_members(request):
    today = date.today()
    classes = Session.gen(today - timedelta(days=365), today, lambda d: d.weekday() in [0, 3])
    students = {str(s.uuid): {
                                 'uuid': str(s.uuid),
                                 'name': s.name,
                                 'membership': 'trial' if not s.has_licence() else 'licenced',
                                 'rem_trial_sessions': s.remaining_trial_sessions,
                                 'attendances': [],
                                 'paid': [],
                             }
                             | ({'licence': {'no': s.licence_no, 'exp_time': s.licence_expiry_date.strftime('%d/%m/%Y'),
                                             'exp': s.is_licence_expired()}} if s.has_licence() else {})
                for s in Student.objects.all()}

    attendances = Attendance.objects.filter(date__gte=classes[-1].date)

    for a in attendances:
        students[str(a.student_id)]['attendances'].append(str(a.session_date))
        if a.has_paid:
            students[str(a.student_id)]['paid'].append(str(a.session_date))

    return JsonResponse(list(students.values()), safe=False)


@login_required_401
@require_http_methods(['POST'])
@handle_error
def post_log_attendance(request):
    student_uuid = request.POST.get('student_uuid')
    sess_date = date.fromisoformat(request.POST.get('sess_date'))
    paid = request.POST.get('paid')
    existing_registration = False

    s = Student.objects.get(pk=student_uuid)
    existing = Attendance.objects.filter(student=s, date=sess_date)
    if existing.count() > 0:
        existing_registration = True
        existing.delete()

    a = Attendance.register_student(s, date=sess_date, existing_registration=existing_registration)

    if paid:
        a.mark_as_paid()

    a.save()
    return JsonResponse({'success': None})


@login_required_401
@require_http_methods(['POST'])
def post_clear_attendance(request):
    student_uuid = request.POST.get('student_uuid')
    sess_date = request.POST.get('sess_date')

    Attendance.clear(Student.objects.get(pk=student_uuid), date=date.fromisoformat(sess_date))
    return JsonResponse({'success': None})
