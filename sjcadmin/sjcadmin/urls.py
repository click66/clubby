from django.conf import settings
from django.urls import include, path

from .controllers.api import admin as api_admin, attendance as api_attendance, auth as api_auth, courses as api_courses, members as api_members

urlpatterns = [
    path('api/auth/jwt', api_auth.get_jwt),
    path('api/auth/login', api_auth.login),
    path('api/auth/refresh', api_auth.refresh_token),
    path('api/auth/change_password', api_auth.change_password),

    path('api/members', api_members.get_members),
    path('api/members/<uuid:pk>', api_members.get_member),
    path('api/members/add', api_members.post_add_member),
    path('api/members/query', api_members.get_members_query),
    path('api/members/<uuid:pk>/profile',
         api_members.post_update_member_profile),
    path('api/members/delete/<uuid:pk>', api_members.post_delete_member),
    path('api/members/<uuid:pk>/licences', api_members.get_member_licences),
    path('api/members/<uuid:pk>/licences/add',
         api_members.post_add_member_licence),
    path('api/members/<uuid:pk>/notes/add', api_members.post_add_member_note),
    path('api/members/<uuid:pk>/courses/add', api_members.post_add_member_to_course),
    path('api/members/<uuid:pk>/courses/remove', api_members.post_remove_member_from_course),
    path('api/members/<uuid:pk>/deactivate', api_members.post_mark_member_inactive),
    path('api/members/<uuid:pk>/activate', api_members.post_mark_member_active),

    path('api/members/<uuid:pk>/payments/add',
         api_members.post_add_member_payment),

    path('api/payments/query', api_members.post_query_member_payments),

    path('api/attendance', api_attendance.get_attendance),
    path('api/attendance/log', api_attendance.post_log_attendance),
    path('api/attendance/clear', api_attendance.post_clear_attendance),

    path('api/courses', api_courses.get_courses),
    path('api/courses/<uuid:pk>', api_courses.get_course),
    path('api/courses/add', api_courses.post_add_course),
    path('api/courses/delete/<uuid:pk>', api_courses.post_delete_course),

    # Admin routes
    path('api/clubs', api_admin.get_clubs),
    path('api/clubs/create', api_admin.create_club),
    path('api/clubs/<uuid:club_uuid>/create_user', api_admin.create_club_user),
]

if settings.DEBUG:
    from silk import urls as silk_urls

    urlpatterns += [path('silk/', include(silk_urls))]
