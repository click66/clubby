import json

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
    # Serialize students
    serialized_students = {}
    for s in students:
        student_data = {
            'uuid': str(s.uuid),
            'name': s.name,
            'membership': 'trial' if not s.has_licence() else 'licenced',
            'rem_trial_sessions': s.remaining_trial_sessions,
            'signed_up_for': [c.uuid for c in s.courses],
            'has_notes': s.has_notes,
            'prepayments': {},
        }

        for c in s.courses:
            prepaid = s.has_prepaid(c)
            student_data['prepayments'][str(c.uuid)] = prepaid is not None

        if s.has_licence():
            student_data['licence'] = {
                'no': s.licence_no,
                'exp_time': s.licence_expiry_date.strftime('%d/%m/%Y'),
                'exp': s.is_licence_expired()
            }
        serialized_students[str(s.uuid)] = student_data

    # Hydrate attendance data
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

    # Merge attendence data with serialized students
    for s in serialized_students:
        serialized_students[s].update(attendance_dict[s])

    return serialized_students


@login_required_401
@require_http_methods(['GET'])
def get_attendance(request):
    course_uuids = request.GET.getlist('courses[]')

    today = date.today()
    range_end = today - timedelta(days=365)

    attendances = Attendance.objects.filter(date__gte=range_end)

    students = Student.fetch_signed_up_for_multiple(course_uuids)

    response = JsonResponse(list(serialize_attendance(attendances, students).values()), safe=False)

    return response


@login_required_401
@require_http_methods(['POST'])
@handle_error
def post_log_attendance(request):
    data = json.loads(request.body)

    student_uuid = data.get('student_uuid')
    sess_date = date.fromisoformat(data.get('sess_date'))
    product_uuid = data.get('product').split(',')[0]
    payment = data.get('payment')
    payment_option = data.get('payment_option')

    if not product_uuid:
        raise ValueError('No valid product/course found for this submission')

    s = Student.fetch_by_uuid(student_uuid)
    c = Course.objects.get(_uuid=product_uuid)
    Attendance.clear(s, sess_date)

    a = Attendance.register_student(
        s, date=sess_date, course=c)

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
    data = json.loads(request.body)

    student_uuid = data.get('student_uuid')
    sess_date = data.get('sess_date')
    s = Student.fetch_by_uuid(student_uuid)

    Attendance.clear(s, date=date.fromisoformat(sess_date))

    today = date.today()
    range_end = today - timedelta(days=365)
    return JsonResponse({'success': serialize_attendance(
        Attendance.objects.filter(
            date__gte=range_end, student__uuid=str(student_uuid)
        ), [s])[str(student_uuid)]})
