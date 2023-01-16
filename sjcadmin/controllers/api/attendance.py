from collections import defaultdict
from datetime import date, timedelta
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from ._middleware import handle_error, login_required_401
from ...models.attendance import Attendance
from ...models.course import Course
from ...models.student import Student, Payment


def serialize_attendance(attendances: list[Attendance], students: list[Student]):
    students = {
        str(s.uuid): {
            'uuid': str(s.uuid),
            'name': s.name,
            'membership': 'trial' if not s.has_licence() else 'licenced',
            'rem_trial_sessions': s.remaining_trial_sessions,
            'signed_up_for': [c.uuid for c in s.courses],
            'has_notes': s.has_notes,
            'has_prepaid': any(s.has_prepaid(c) for c in s.courses),
            'prepayments': {str(c.uuid): prepaid is not None for c in s.courses for prepaid in [s.has_prepaid(c)]},
            **({'licence': {'no': s.licence_no, 'exp_time': s.licence_expiry_date.strftime('%d/%m/%Y'), 'exp': s.is_licence_expired()}} if s.has_licence() else {})
        } for s in students
    }

    attendance_dict = defaultdict(
        lambda: {'attendances': [], 'paid': [], 'complementary': []})

    for a in attendances:
        attendance_dict[str(a.student_id)]['attendances'].append(
            str(a.session_date))

        if a.has_paid:
            attendance_dict[str(a.student_id)]['paid'].append(
                str(a.session_date))
        elif a.is_complementary:
            attendance_dict[str(a.student_id)]['complementary'].append(
                str(a.session_date))

    for s in students:
        students[s].update(attendance_dict[s])

    return students


@login_required_401
@require_http_methods(['GET'])
def get_attendance(request):
    today = date.today()
    range_end = today - timedelta(days=365)
    return JsonResponse(list(serialize_attendance(
        Attendance.objects.filter(date__gte=range_end),
        Student.objects.all()).values(),
    ), safe=False)


@login_required_401
@require_http_methods(['POST'])
@handle_error
def post_log_attendance(request):
    student_uuid = request.POST.get('student_uuid')
    sess_date = date.fromisoformat(request.POST.get('sess_date'))
    product_uuid = request.POST.get('product').split(',')[0]
    payment = request.POST.get('payment')
    payment_option = request.POST.get('payment_option')
    existing_registration = False

    if not product_uuid:
        raise ValueError('No valid product/course found for this submission')

    s = Student.objects.get(pk=student_uuid)
    c = Course.objects.get(_uuid=product_uuid)
    existing = Attendance.objects.filter(student=s, date=sess_date)
    if existing.count() > 0:
        existing_registration = True
        existing.delete()

    a = Attendance.register_student(
        s, date=sess_date, existing_registration=existing_registration, course=c)

    match payment:
        case 'complementary':
            a.mark_as_complementary()
        case 'paid':
            if payment_option == 'now':
                s.take_payment(Payment.make(timezone.now(), c))
            a.pay()

    a.save()
    s.save()

    today = date.today()
    range_end = today - timedelta(days=365)
    return JsonResponse({'success': serialize_attendance(
        Attendance.objects.filter(
            date__gte=range_end, student__uuid=str(s.uuid)),
        [s])[str(s.uuid)]})


@login_required_401
@require_http_methods(['POST'])
def post_clear_attendance(request):
    student_uuid = request.POST.get('student_uuid')
    sess_date = request.POST.get('sess_date')
    s = Student.objects.get(pk=student_uuid)

    Attendance.clear(s, date=date.fromisoformat(sess_date))

    today = date.today()
    range_end = today - timedelta(days=365)
    return JsonResponse({'success': serialize_attendance(
        Attendance.objects.filter(
            date__gte=range_end, student__uuid=str(student_uuid)
        ), [s])[str(student_uuid)]})
