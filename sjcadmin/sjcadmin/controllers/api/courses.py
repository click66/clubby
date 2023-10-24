import json

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from datetime import date
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ._middleware import handle_error, login_required_401, role_required
from ..baseserializer import BaseSerialiser
from ...models.attendance import Attendance
from ...models.course import Course
from ...models.session import Session


class CourseSerializer(BaseSerialiser):
    uuid = serializers.UUIDField(required=False)
    label = serializers.CharField(allow_blank=True)
    days = serializers.ListField(child=serializers.IntegerField(), required=False)
    dates = serializers.ListField(child=serializers.DateField(), required=False)
    next_session = serializers.SerializerMethodField(required=False)

    def get_next_session(self, obj: Course):
        next = Session.gen_next(self.context['today'], obj)
        return next.date if next else None


@handle_error
@login_required_401
@role_required(['staff'])
@api_view(['GET'])
def courses(request):
    courses = Course.objects.filter(tenant_uuid=request.user.tenant_uuid)
    return Response(list(map(lambda c: CourseSerializer(c, context={'today': date.today()}).data, courses)))


@login_required_401
@role_required(['staff'])
@api_view(['GET'])
@handle_error
def get_course(request, pk):
    c = Course.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)
    if not c:
        return Response({'error': 'Course not ofound'}, 404)

    return Response(CourseSerializer(c, context={'today': date.today()}).data)


@handle_error
@login_required_401
@role_required(['staff'])
@api_view(['POST'])
def delete_course(request, pk):
    c = Course.fetch_by_uuid(pk, tenant_uuid=request.user.tenant_uuid)

    if c:
        Attendance.objects.filter(_course=c).delete()

    c.delete()

    return Response(None, 204)


@handle_error
@login_required_401
@role_required(['staff'])
@api_view(['POST'])
def create(request):
    data = CourseSerializer(data=request.data)
    if not data.is_valid():
        return Response(data.errors, status=400)

    data = data.validated_data

    course = Course.make(
        label=data.get('label', None),
        days=data.get('days', []),
        dates=data.get('dates', []),
    )
    course.tenant_uuid = request.user.tenant_uuid
    course.save()

    return Response(CourseSerializer(course, context={'today': date.today()}).data)
