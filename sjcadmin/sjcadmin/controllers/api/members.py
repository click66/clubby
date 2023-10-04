from uuid import UUID

import humps
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ._middleware import handle_error, login_required_401, role_required
from ...models.student import Student as Member
from ....sjcauth.models import User


class BaseSerialiser(serializers.Serializer):
    def to_representation(self, instance):
        return humps.camelize(super().to_representation(instance))


class CourseSerializer(BaseSerialiser):
    uuid = serializers.UUIDField()


class MemberQuerySerializer(BaseSerialiser):
    courses = CourseSerializer(many=True, required=False)
    user = serializers.UUIDField(required=False)


class LicenceSerializer(BaseSerialiser):
    number = serializers.IntegerField()
    expiry_date = serializers.DateField(source='expires')


class PaymentSerializer(BaseSerialiser):
    course = serializers.PrimaryKeyRelatedField(read_only=True)


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


@handle_error
@login_required_401
@role_required(['member', 'staff'])
@api_view(['GET'])
def member(request, pk: UUID):
    m = Member.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)

    if (not request.user.is_staff and not request.user.is_superuser) and not m.is_user(request.user):
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

    if not request.user.is_staff and not request.user.is_superuser:    # User is member
        if user is None or (user and user.uuid != request.user.uuid):
            return Response({'error': 'Member is not authorised.'}, 403)

    members = Member.fetch_query(
        course_uuids=courses,
        user=user,
        tenant_uuid=request.user.tenant_uuid,
    )

    return Response(list(map(lambda m: MemberSerializer(m).data, members)))
