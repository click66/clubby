import json

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from datetime import date

from ._middleware import handle_error, login_required_401
from ...models.attendance import Attendance
from ...models.course import Course
from ...models.student import Licence, Note, Student, Payment, Profile
from ....sjcauth.models import User


def _username(student) -> str:
    return student._creator_name


@login_required_401
@require_http_methods(['GET'])
def get_members(request):
    students = Student.fetch_all(tenant_uuid=request.user.tenant_uuid)
    students_data = []
    for s in students:
        student_data = {
            'uuid': str(s.uuid),
            'active': s.active,
            'name': s.name,
            'dob': s.dob,
            'address': s.address,
            'phone': s.phone,
            'email': s.email,
            'membership': 'trial' if not s.has_licence() else 'licenced',
            'allowed_trial_sessions': s.allowed_trial_sessions,
            'rem_trial_sessions': s.remaining_trial_sessions,
            'signed_up_for': list(map(lambda c: str(c.uuid), s.courses)),
            'member_since': s.join_date,
            'added_by': _username(s),
            'unused_payments': list(map(lambda p: {'course_uuid': None if p.course is None else p.course.uuid}, s.get_unused_payments()))
        }
        if s.has_licence():
            student_data.update({'licence': {
                'no': s.licence_no,
                'exp_time': s.licence_expiry_date.strftime('%d/%m/%Y'),
                'exp': s.is_licence_expired()
            }})
        students_data.append(student_data)
    return JsonResponse(students_data, safe=False)


@login_required_401
@require_http_methods(['GET'])
@csrf_exempt
def get_member(request, pk):
    # return JsonResponse({})
    s = Student.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)
    r = {
        'uuid': str(s.uuid),
        'active': s.active,
        'name': s.name,
        'dob': s.dob,
        'address': s.address,
        'phone': s.phone,
        'email': s.email,
        'membership': 'trial' if not s.has_licence() else 'licenced',
        'allowed_trial_sessions': s.allowed_trial_sessions,
        'rem_trial_sessions': s.remaining_trial_sessions,
        'signed_up_for': list(map(lambda c: str(c.uuid), s.courses)),
        'member_since': s.join_date,
        'added_by': _username(s),
        'unused_payments': list(map(lambda p: {'course_uuid': p.course.uuid if p.course else None}, s.get_unused_payments()))
    }
    if s.has_licence():
        r.update({'licence': {
            'no': s.licence_no,
            'exp_time': s.licence_expiry_date.strftime('%d/%m/%Y'),
            'exp': s.is_licence_expired()
        }})
    return JsonResponse(r)


@login_required_401
@require_http_methods(['POST'])
@csrf_exempt
def get_members_by_courses(request):
    data = json.loads(request.body)
    course_uuids = data.get('courses')

    students = Student.fetch_signed_up_for_multiple(
        course_uuids, tenant_uuid=request.user.tenant_uuid)

    return JsonResponse(list(map(lambda s: {
        'uuid': str(s.uuid),
        'active': s.active,
        'name': s.name,
        'dob': s.dob,
        'address': s.address,
        'phone': s.phone,
        'email': s.email,
        'membership': 'trial' if not s.has_licence() else 'licenced',
        'allowed_trial_sessions': s.allowed_trial_sessions,
        'rem_trial_sessions': s.remaining_trial_sessions,
        'signed_up_for': [c.uuid for c in s.courses],
        'has_notes': s.has_notes,
        'prepayments': {},
        'member_since': s.join_date,
        'added_by': _username(s),
        'unused_payments': list(map(lambda p: {'course_uuid': p.course.uuid if p.course else None}, s.get_unused_payments()))
    } | (
        {'licence': {
            'no': s.licence_no,
            'exp_time': s.licence_expiry_date.strftime('%d/%m/%Y'),
            'exp': s.is_licence_expired()
        }} if s.has_licence() else {}
    ), students)), safe=False)


@login_required_401
@require_http_methods(['GET'])
def get_member_licences(request, pk):
    s = Student.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)
    return JsonResponse(s.licences)


@login_required_401
@require_http_methods(['POST'])
@csrf_exempt
@handle_error
def post_add_member(request):
    data = json.loads(request.body)
    s = Student.make(name=data.get('studentName'), creator=request.user)
    s.tenant_uuid = request.user.tenant_uuid
    s.save()

    product_uuid = data.get('product')
    if product_uuid:
        c = Course.objects.get(
            _uuid=product_uuid, tenant_uuid=request.user.tenant_uuid)
        s.sign_up(c)
        s.save()

    r = {
        'uuid': str(s.uuid),
        'active': s.active,
        'name': s.name,
        'dob': s.dob,
        'address': s.address,
        'phone': s.phone,
        'email': s.email,
        'membership': 'trial' if not s.has_licence() else 'licenced',
        'allowed_trial_sessions': s.allowed_trial_sessions,
        'rem_trial_sessions': s.remaining_trial_sessions,
        'signed_up_for': list(map(lambda c: str(c.uuid), s.courses)),
        'member_since': s.join_date,
        'added_by': _username(s),
        'unused_payments': list(map(lambda p: {'course_uuid': p.course.uuid if p.course else None}, s.get_unused_payments()))
    }

    return JsonResponse({'success': r})


@login_required_401
@require_http_methods(['POST'])
@handle_error
@csrf_exempt
def post_update_member_profile(request, pk):
    s = Student.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)

    json_data = json.loads(request.body)
    s.set_profile(Profile(**{key: json_data[key] for key in [
        'name',
        'dob',
        'phone',
        'email',
        'address',
    ] if key in json_data}))
    s.save()

    return JsonResponse({'success': {'uuid': s.uuid}})


@login_required_401
@require_http_methods(['POST'])
@handle_error
@csrf_exempt
def post_delete_member(request, pk):
    s = Student.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)
    if s:
        Attendance.objects.filter(student=s).delete()
    s.delete()

    return JsonResponse({'success': {'uuid': s.uuid}})


@login_required_401
@require_http_methods(['POST'])
@handle_error
@csrf_exempt
def post_mark_member_inactive(request, pk):
    s = Student.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)
    s.active = False
    s.save()
    return JsonResponse({'success': None})


@login_required_401
@require_http_methods(['POST'])
@handle_error
@csrf_exempt
def post_mark_member_active(request, pk):
    s = Student.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)
    s.active = True
    s.save()
    return JsonResponse({'success': None})


@login_required_401
@require_http_methods(['POST'])
@handle_error
@csrf_exempt
def post_add_member_licence(request, pk):
    data = json.loads(request.body)
    s = Student.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)
    number = data.get('number')
    expire_date = date.fromisoformat(data.get('expire_date'))
    s.add_licence(Licence(number=number, expires=expire_date))
    s.save()

    return JsonResponse({'success': None})


@login_required_401
@require_http_methods(['POST'])
@handle_error
def post_add_member_note(request, pk):
    data = json.loads(request.body)
    s = Student.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)
    text = data.get('text')

    s.add_note(Note.make(text, author=request.user.uuid, datetime=timezone.now()))
    s.save()

    return JsonResponse({'success': None})


@login_required_401
@require_http_methods(['POST'])
@handle_error
@csrf_exempt
def post_add_member_to_course(request, pk):
    data = json.loads(request.body)
    s = Student.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)
    course = Course.fetch_by_uuid(
        data.get('uuid'), tenant_uuid=request.user.tenant_uuid)
    s._courses.add(course)
    s.save()

    return JsonResponse({'success': None})


@login_required_401
@require_http_methods(['POST'])
@handle_error
@csrf_exempt
def post_remove_member_from_course(request, pk):
    data = json.loads(request.body)
    s = Student.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)
    course = Course.fetch_by_uuid(
        data.get('uuid'), tenant_uuid=request.user.tenant_uuid)
    s._courses.remove(course)
    s.save()

    return JsonResponse({'success': None})


# Payments API

@login_required_401
@require_http_methods(['POST'])
@handle_error
@csrf_exempt
def post_add_member_payment(request, pk):
    s = Student.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)
    data = json.loads(request.body)
    product_id = data.get('product')
    c = Course.objects.get(_uuid=product_id)

    s.take_payment(Payment.make(timezone.now(), c))
    s.save()

    return JsonResponse({'success': None})


@login_required_401
@require_http_methods(['POST'])
@handle_error
@csrf_exempt
def post_query_member_payments(request):
    data = json.loads(request.body)
    memberUuid = data.get('memberUuid')
    s = Student.fetch_by_uuid(memberUuid, tenant_uuid=request.user.tenant_uuid)

    last_30_used_payments = s.get_last_payments(30)
    unused_payments = s.get_unused_payments()

    return JsonResponse({'success': list(map(lambda p: {
        'datetime': p.time,
        'courseUuid': p.course.uuid if p.course else None,
        'used': p.used,
    }, last_30_used_payments + unused_payments))})
