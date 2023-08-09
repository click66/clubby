from django.contrib import admin
from django.urls import path

from .controllers.api import attendance as api_attendance, courses as api_courses, members as api_members

from .controllers import attendance, auth, courses, home, members, reports

urlpatterns = [
    path('auth/login', auth.login),
    path('auth/logout', auth.logout),

    path('', home.home, name='home'),

    path('courses', courses.courses, name='courses'),

    path('members', members.members, name='members'),
    path('members/<uuid:pk>', members.member, name='member'),

    path('attendance', attendance.attendance, name='attendance'),
    path('attendance/<uuid:course_uuid>', attendance.attendance, name='course_attendance'),

    path('reports', reports.reports, name='reports'),
    path('reports/attendance/download', reports.attendance_download),

    path('api/members', api_members.get_members),
    path('api/members/add', api_members.post_add_member),
    path('api/members/<uuid:pk>/profile', api_members.post_update_member_profile),
    path('api/members/delete/<uuid:pk>', api_members.post_delete_member),
    path('api/members/<uuid:pk>/licences', api_members.get_member_licences),
    path('api/members/<uuid:pk>/licences/add', api_members.post_add_member_licence),
    path('api/members/<uuid:pk>/notes/add', api_members.post_add_member_note),
    path('api/members/<uuid:pk>/payments/add', api_members.post_add_member_payment),

    path('api/attendance', api_attendance.get_attendance),
    path('api/attendance/log', api_attendance.post_log_attendance),
    path('api/attendance/clear', api_attendance.post_clear_attendance),

    path('api/courses/add', api_courses.post_add_course),
    path('api/courses/delete/<uuid:pk>', api_courses.post_delete_course),
]
