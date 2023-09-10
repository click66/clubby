import json
import os
import requests

from collections import defaultdict
from datetime import date, timedelta
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from ._middleware import handle_error, login_required_401
from ...models.attendance import Attendance
from ...models.course import Course
from ...models.student import Student, Payment
from ...services.attendance import get_producer as attendance_producer


def serialize_attendance_dict(attendances: list[dict], students: list[Student]):
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
        attendance_dict[str(a['student_uuid'])
                        ]['attendances'].append(a['date'])

        if a['resolution'] == 'paid':
            attendance_dict[str(a['student_uuid'])]['paid'].append(a['date'])
        elif a['resolution'] == 'comp':
            attendance_dict[str(a['student_uuid'])][
                'complementary'].append(a['date'])

    # Merge attendence data with serialized students
    for s in serialized_students:
        serialized_students[s].update(attendance_dict[s])

    return serialized_students


def serialize_attendance_local(attendances: list[dict], students: list[Student]):
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

    students = Student.fetch_signed_up_for_multiple(course_uuids)

    batch_size = 10
    student_batches = [students[i:i + batch_size]
                       for i in range(0, len(students), batch_size)]

    attendances = []

    for course_uuid in course_uuids:
        for student_batch in student_batches:
            attendances_response = requests.get(f"{os.getenv('API_ROOT')}/attendance/", {
                'course': course_uuid,
                'student[]': [student.uuid for student in student_batch],
                'date_earliest': range_end,
                'date_latest': today,
            }).json()['attendances']

        attendances.extend(attendances_response)
    # # attendances = Attendance.objects.filter(date__gte=range_end)
    # attendances = []
    # for course_uuid in course_uuids:
    #     attendances = attendances + requests.get(f"{os.getenv('API_ROOT')}/attendance/", {
    #         'course': course_uuid,
    #         'student[]': list(map(lambda s: s.uuid, students)),
    #         'date_earliest': range_end,
    #         'date_latest': today,
    #     }).json()['attendances']

    response = JsonResponse(list(serialize_attendance_dict(
        attendances, students).values()), safe=False)

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

    '''
        Attendance event producer
    '''
    producer = attendance_producer()
    producer.publish({
        'action': 'create',
        'data': {
            'date': sess_date.isoformat(),
            'student_uuid': student_uuid,
            'course_uuid': product_uuid,
            'resolution': None if payment is None else payment[:4],
        }
    })

    return JsonResponse({'success': serialize_attendance_local(
        Attendance.objects.filter(
            date__gte=range_end, student__uuid=str(s.uuid)),
        [s])[str(s.uuid)]})


@login_required_401
@require_http_methods(['POST'])
def post_clear_attendance(request):
    data = json.loads(request.body)

    student_uuid = data.get('student_uuid')
    sess_date = data.get('sess_date')
    product_uuid = data.get('product')
    s = Student.fetch_by_uuid(student_uuid)

    Attendance.clear(s, date=date.fromisoformat(sess_date))

    '''
        Attendance event producer
    '''
    producer = attendance_producer()
    producer.publish({
        'action': 'delete',
        'data': {
            'date': sess_date,
            'student_uuid': student_uuid,
            'course_uuid': product_uuid,
        }
    })

    today = date.today()
    range_end = today - timedelta(days=365)
    return JsonResponse({'success': serialize_attendance_local(
        Attendance.objects.filter(
            date__gte=range_end, student__uuid=str(student_uuid)
        ), [s])[str(student_uuid)]})
