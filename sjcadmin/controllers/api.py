import json

from functools import wraps
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from datetime import date, datetime, timedelta
from ..errors import DomainError
from ..models.attendance import Attendance
from ..models.session import Session
from ..models.student import Licence, Note, Student


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
        except (DomainError, ValueError) as e:
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
                                 'has_notes': s.has_notes,
                                 'attendances': [],
                                 'paid': [],
                                 'complementary': [],
                             }
                             | ({'licence': {'no': s.licence_no, 'exp_time': s.licence_expiry_date.strftime('%d/%m/%Y'),
                                             'exp': s.is_licence_expired()}} if s.has_licence() else {})
                for s in Student.objects.all()}

    attendances = Attendance.objects.filter(date__gte=classes[-1].date)

    for a in attendances:
        students[str(a.student_id)]['attendances'].append(str(a.session_date))
        match True:
            case a.has_paid:
                students[str(a.student_id)]['paid'].append(str(a.session_date))
            case a.is_complementary:
                students[str(a.student_id)]['complementary'].append(str(a.session_date))

    return JsonResponse(list(students.values()), safe=False)


@login_required_401
@require_http_methods(['GET'])
def get_member_licences(request, pk):
    s = Student.objects.get(uuid=pk)
    return JsonResponse(s.licences)



@login_required_401
@require_http_methods(['POST'])
@handle_error
def post_add_member(request):
    s = Student.make(name=request.POST.get('studentName'))
    s.save()

    return JsonResponse({'success': {'uuid': s.uuid}})


@login_required_401
@require_http_methods(['POST'])
@handle_error
def post_delete_member(request, pk):
    s = Student.objects.get(uuid=pk)
    if s:
        Attendance.objects.filter(student=s).delete()
    s.delete()

    return JsonResponse({'success': {'uuid': s.uuid}})


@login_required_401
@require_http_methods(['POST'])
@handle_error
def post_add_member_licence(request, pk):
    s = Student.objects.get(uuid=pk)
    number = request.POST.get('number')
    expire_date = date.fromisoformat(request.POST.get('expire_date'))
    s.add_licence(Licence(number=number, expires=expire_date))
    s.save()

    return JsonResponse({'success': None})


@login_required_401
@require_http_methods(['POST'])
@handle_error
def post_add_member_note(request, pk):
    data = json.loads(request.body)
    s = Student.objects.get(uuid=pk)
    text = data.get('text')

    s.add_note(Note.make(text, author=request.user, datetime=timezone.now()))
    s.save()

    return JsonResponse({'success': None})


@login_required_401
@require_http_methods(['POST'])
@handle_error
def post_log_attendance(request):
    student_uuid = request.POST.get('student_uuid')
    sess_date = date.fromisoformat(request.POST.get('sess_date'))
    payment = request.POST.get('payment')
    existing_registration = False

    s = Student.objects.get(pk=student_uuid)
    existing = Attendance.objects.filter(student=s, date=sess_date)
    if existing.count() > 0:
        existing_registration = True
        existing.delete()

    a = Attendance.register_student(s, date=sess_date, existing_registration=existing_registration)

    match payment:
        case 'complementary':
            a.mark_as_complementary()
        case 'paid':
            a.mark_as_paid()
        case 'advance':
            a.prepaid()

    a.save()
    s.save()
    return JsonResponse({'success': None})


@login_required_401
@require_http_methods(['POST'])
def post_clear_attendance(request):
    student_uuid = request.POST.get('student_uuid')
    sess_date = request.POST.get('sess_date')

    Attendance.clear(Student.objects.get(pk=student_uuid), date=date.fromisoformat(sess_date))
    return JsonResponse({'success': None})
