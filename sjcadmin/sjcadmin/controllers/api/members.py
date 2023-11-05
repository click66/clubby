from datetime import date
from uuid import UUID

from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ._middleware import handle_error, login_required_401, role_required
from ..baseserializer import BaseSerialiser
from ...models.attendance import Attendance
from ...models.student import Student as Member, Payment, Subscription
from ...models.course import Course
from ...models.tenant import Tenant
from ...schemas import BaseSerialiser
from ....sjcauth.models import User


class CourseSerializer(BaseSerialiser):
    uuid = serializers.UUIDField()
    label = serializers.CharField(required=False, allow_blank=True)


class MemberQuerySerializer(BaseSerialiser):
    courses = CourseSerializer(many=True, required=False)
    user = serializers.UUIDField(required=False)
    name = serializers.CharField(required=False, allow_blank=True)


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
    club_name = serializers.CharField()

    licence = LicenceSerializer(required=False)
    courses = CourseSerializer(many=True, read_only=True)
    unused_payments = PaymentSerializer(
        many=True, read_only=True, source='get_unused_payments')

    subscriptions = serializers.SerializerMethodField()

    def get_subscriptions(self, obj: Member):
        today = self.context['today']
        subscriptions = obj.get_unexpired_subscriptions(today)
        return list(map(lambda s: SubscriptionSerializer(s).data, subscriptions))


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
    m = Member.fetch_by_uuid(member_uuid, club_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not m.is_user(request.user):
        return Response({'error': 'Member is not authorised.'}, 403)

    return Response(MemberSerializer(m, context={'today': date.today()}).data)


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
        name=query.get('name', None),
        club_uuid=request.user.tenant_uuid,
    )

    return Response(list(map(lambda m: MemberSerializer(m, context={'today': date.today()}).data, members)))


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
    member.club = Tenant.objects.get(uuid=request.user.tenant_uuid)

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

    return Response(MemberSerializer(member, context={'today': date.today()}).data)


@handle_error
@login_required_401
@role_required(['staff'])
@api_view(['POST'])
def delete(request, member_uuid):
    member = Member.fetch_by_uuid(
        member_uuid, club_uuid=request.user.tenant_uuid)

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
        member_uuid, club_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not member.is_user(request.user):
        return Response({'error': 'Member is not authorised'}, 403)

    course = Course.objects.get(_uuid=data.get('course').get(
        'uuid'), tenant_uuid=member.club_uuid)

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
        member_uuid, club_uuid=request.user.tenant_uuid)

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
        member_uuid, club_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not member.is_user(request.user):
        return Response({'error': 'Member is not authorised'}, 403)

    course = Course.objects.get(_uuid=data.get(
        'course').get('uuid'), tenant_uuid=member.club_uuid)

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
        member_uuid, club_uuid=request.user.tenant_uuid)

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
        member_uuid, club_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not member.is_user(request.user):
        return Response({'error': 'Member is not authorised'}, 403)

    course = Course.objects.get(_uuid=data.get('course').get(
        'uuid'), tenant_uuid=member.club_uuid)

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
        member_uuid, club_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not member.is_user(request.user):
        return Response({'error': 'Member is not authorised'}, 403)

    return Response(list(map(lambda s: SubscriptionSerializer(s).data, member.subscriptions)))


@login_required_401
@role_required(['member', 'staff'])
@api_view(['POST'])
@handle_error
def cancel_subscription(request, member_uuid):
    data = CourseSerializer(data=request.data.get('course'))
    if not data.is_valid():
        return Response(data.errors, status=400)

    data = data.validated_data

    member = Member.fetch_by_uuid(member_uuid) if request.user.is_member_user else Member.fetch_by_uuid(
        member_uuid, club_uuid=request.user.tenant_uuid)

    if request.user.is_member_user and not member.is_user(request.user):
        return Response({'error': 'Member is not authorised'}, 403)

    course = Course.objects.get(_uuid=data.get(
        'uuid'), tenant_uuid=member.club_uuid)

    Subscription.objects.filter(student=member, course=course).delete()

    return Response(None, 204)
