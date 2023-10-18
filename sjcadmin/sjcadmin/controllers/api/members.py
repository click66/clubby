from uuid import UUID

import humps
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ._middleware import handle_error, login_required_401, role_required
from ...models.attendance import Attendance
from ...models.student import Student as Member, Payment, Subscription
from ...models.course import Course
from ....sjcauth.models import User


class BaseSerialiser(serializers.Serializer):
    def to_internal_value(self, data):
        snake_case_data = {}

        # Convert camelCase keys to snake_case
        for key, value in data.items():
            snake_case_key = humps.decamelize(key)
            snake_case_data[snake_case_key] = value

        return super().to_internal_value(snake_case_data)

    def to_representation(self, instance):
        return humps.camelize(super().to_representation(instance))


class CourseSerializer(BaseSerialiser):
    uuid = serializers.UUIDField()
    label = serializers.CharField(required=False)


class MemberQuerySerializer(BaseSerialiser):
    courses = CourseSerializer(many=True, required=False)
    user = serializers.UUIDField(required=False)


class LicenceSerializer(BaseSerialiser):
    number = serializers.IntegerField()
    expiry_date = serializers.DateField(source='expires')


class PaymentSerializer(BaseSerialiser):
    course = CourseSerializer()
    datetime = serializers.DateTimeField(required=False, source='time')
    used = serializers.BooleanField(required=False)


class SubscriptionSerializer(BaseSerialiser):
    course = CourseSerializer()
    type = serializers.CharField()
    expiry_date = serializers.DateField(required=False, allow_null=True)


class MemberSerializer(BaseSerialiser):
    uuid = serializers.CharField()
    name = serializers.CharField()
    active = serializers.BooleanField()
    email = serializers.CharField()
    phone = serializers.CharField()
    date_of_birth = serializers.DateField()
    address = serializers.CharField()
    join_date = serializers.DateField()
    remaining_trial_sessions = serializers.IntegerField()
    added_by = serializers.CharField()

    licence = LicenceSerializer(required=False)
    courses = CourseSerializer(many=True, read_only=True)
    unused_payments = PaymentSerializer(
        many=True, read_only=True, source='get_unused_payments')


class NewMemberSerializer(BaseSerialiser):
    name = serializers.CharField()
    email = serializers.CharField(required=False)
    course = CourseSerializer(required=False)


class AttendanceSerializer(BaseSerialiser):
    course = CourseSerializer()
    date = serializers.DateField()
    payment = serializers.ChoiceField(
        choices=['complementary', 'comp', 'paid', 'attending'], allow_null=True, required=False)
    payment_option = serializers.ChoiceField(
        choices=['now', 'advance', 'subscription'], required=False)


@handle_error
@login_required_401
@role_required(['member', 'staff'])
@api_view(['GET'])
def member(request, member_uuid: UUID):
    m = Member.fetch_by_uuid(member_uuid, tenant_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not m.is_user(request.user):
        return Response({'error': 'Member is not authorised.'}, 403)

    return Response(MemberSerializer(m).data)


@handle_error
@login_required_401
@role_required(['member', 'staff'])
@api_view(['POST'])
def query(request):
    query = MemberQuerySerializer(data=request.data)
    if not query.is_valid():
        return Response(query.errors, status=400)

    query = query.validated_data

    courses = list(map(lambda c: c.get('uuid'), query.get('courses', [])))
    user = User.fetch_by_uuid(query.get('user')) if 'user' in query else None

    if request.user.is_member_user:
        if user is None or (user and user.uuid != request.user.uuid):
            return Response({'error': 'Member is not authorised.'}, 403)

    members = Member.fetch_query(
        course_uuids=courses,
        user=user,
        tenant_uuid=request.user.tenant_uuid,
    )

    return Response(list(map(lambda m: MemberSerializer(m).data, members)))


@handle_error
@login_required_401
@role_required(['staff'])
@api_view(['POST'])
def create(request):
    data = NewMemberSerializer(data=request.data)
    if not data.is_valid():
        return Response(data.errors, status=400)

    data = data.validated_data

    member = Member.make(name=data.get('name'), creator=request.user)
    member.tenant_uuid = request.user.tenant_uuid

    if 'email' in data:
        member.profile_email = data.get('email')

    member.save()

    if 'course' in data:
        course = Course.objects.get(
            _uuid=data.get('course', {}).get('uuid'),
            tenant_uuid=request.user.tenant_uuid,
        )
        member.sign_up(course)
        member.save()

    return Response(MemberSerializer(member).data)


@handle_error
@login_required_401
@role_required(['staff'])
@api_view(['POST'])
def delete(request, member_uuid):
    member = Member.fetch_by_uuid(
        member_uuid, tenant_uuid=request.user.tenant_uuid)

    if member:
        Attendance.objects.filter(student=member).delete()

    member.delete()
    return Response(None, 204)


@handle_error
@login_required_401
@role_required(['member', 'staff'])
@api_view(['POST'])
def log_attendance(request, member_uuid):
    data = AttendanceSerializer(data=request.data)
    if not data.is_valid():
        return Response(data.errors, status=400)

    data = data.validated_data

    member = Member.fetch_by_uuid(member_uuid) if request.user.is_member_user else Member.fetch_by_uuid(
        member_uuid, tenant_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not member.is_user(request.user):
        return Response({'error': 'Member is not authorised'}, 403)

    course = Course.objects.get(_uuid=data.get('course').get(
        'uuid'), tenant_uuid=member.tenant_uuid)

    Attendance.clear(member, date=data.get('date'))

    attendance = Attendance.register_student(
        member, date=data.get('date'), course=course)

    payment = data.get('payment')

    match payment:
        case 'complementary':
            attendance.mark_as_complementary()
        case 'comp':
            attendance.mark_as_complementary()
        case 'paid':
            if data.get('payment_option') == 'now':
                member.take_payment(Payment.make(timezone.now(), course))
            attendance.pay(use_subscription=(
                data.get('payment_option') == 'subscription'))

    attendance.save()
    member.save()

    return Response(AttendanceSerializer(attendance).data)


@handle_error
@login_required_401
@role_required(['member', 'staff'])
@api_view(['POST'])
def delete_attendance(request, member_uuid):
    data = AttendanceSerializer(data=request.data)
    if not data.is_valid():
        return Response(data.errors, status=400)

    data = data.validated_data

    member = Member.fetch_by_uuid(member_uuid) if request.user.is_member_user else Member.fetch_by_uuid(
        member_uuid, tenant_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not member.is_user(request.user):
        return Response({'error': 'Member is not authorised'}, 403)

    Attendance.clear(member, date=data.get('date'))

    return Response(None, 204)


@login_required_401
@role_required(['member', 'staff'])
@api_view(['POST'])
@handle_error
def add_payment(request, member_uuid):
    data = PaymentSerializer(data=request.data)
    if not data.is_valid():
        return Response(data.errors, status=400)

    data = data.validated_data

    member = Member.fetch_by_uuid(member_uuid) if request.user.is_member_user else Member.fetch_by_uuid(
        member_uuid, tenant_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not member.is_user(request.user):
        return Response({'error': 'Member is not authorised'}, 403)

    course = Course.objects.get(_uuid=data.get(
        'course').get('uuid'), tenant_uuid=member.tenant_uuid)

    payment = Payment.make(timezone.now(), course)
    member.take_payment(payment)
    member.save()

    return Response(PaymentSerializer(payment).data)


@login_required_401
@role_required(['member', 'staff'])
@api_view(['GET'])
@handle_error
def payments(request, member_uuid):
    member = Member.fetch_by_uuid(member_uuid) if request.user.is_member_user else Member.fetch_by_uuid(
        member_uuid, tenant_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not member.is_user(request.user):
        return Response({'error': 'Member is not authorised'}, 403)

    last_30_used_payments = member.get_last_payments(30)
    unused_payments = member.get_unused_payments()

    return Response(list(map(lambda p: PaymentSerializer(p).data, last_30_used_payments + unused_payments)))


@login_required_401
@role_required(['member', 'staff'])
@api_view(['POST'])
@handle_error
def add_subscription(request, member_uuid):
    data = SubscriptionSerializer(data=request.data)
    if not data.is_valid():
        return Response(data.errors, status=400)

    data = data.validated_data

    member = Member.fetch_by_uuid(member_uuid) if request.user.is_member_user else Member.fetch_by_uuid(
        member_uuid, tenant_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not member.is_user(request.user):
        return Response({'error': 'Member is not authorised'}, 403)

    course = Course.objects.get(_uuid=data.get('course').get(
        'uuid'), tenant_uuid=member.tenant_uuid)

    subscription = Subscription.make('time', data.get('expiry_date'), course)
    member.subscribe(subscription)
    member.save()

    return Response(SubscriptionSerializer(subscription).data)


@login_required_401
@role_required(['member', 'staff'])
@api_view(['GET'])
@handle_error
def subscriptions(request, member_uuid):
    member = Member.fetch_by_uuid(member_uuid) if request.user.is_member_user else Member.fetch_by_uuid(
        member_uuid, tenant_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not member.is_user(request.user):
        return Response({'error': 'Member is not authorised'}, 403)

    return Response(list(map(lambda s: SubscriptionSerializer(s).data, member.subscriptions)))
