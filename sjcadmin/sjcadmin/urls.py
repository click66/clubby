from django.conf import settings
from django.urls import include, path

from .controllers.api import courses as api_courses, members_old as api_members_old
from .controllers.api import admin as api_admin, auth as api_auth, members as api_members

urlpatterns = [
    path('api/auth/login', api_auth.login),
    path('api/auth/refresh', api_auth.refresh_token),
    path('api/auth/change_password', api_auth.change_password),
    path('api/auth/me', api_auth.me),

    path('api/auth/register', api_auth.register, name='register'),
    path('api/auth/activate/<uuid:user_uuid>',
         api_auth.activate_account, name='activate_account'),


    path('api/members/<uuid:member_uuid>', api_members.member),
    path('api/members/<uuid:member_uuid>/delete', api_members.delete),
    path('api/members/query', api_members.query),
    path('api/members/create', api_members.create),

    path('api/members/<uuid:member_uuid>/attendance/log',
         api_members.log_attendance),
    path('api/members/<uuid:member_uuid>/attendance/delete',
         api_members.delete_attendance),

    path('api/members/<uuid:member_uuid>/payments', api_members.payments),
    path('api/members/<uuid:member_uuid>/payments/add',
         api_members.add_payment),

    path('api/members/<uuid:member_uuid>/subscriptions', api_members.subscriptions),
    path('api/members/<uuid:member_uuid>/subscriptions/add',
         api_members.add_subscription),
    path('api/members/<uuid:member_uuid>/subscriptions/cancel',
         api_members.cancel_subscription),

    path('api/courses', api_courses.courses),
    path('api/courses/create', api_courses.create),
    path('api/courses/<uuid:pk>/delete', api_courses.delete_course),
    path('api/courses/<uuid:pk>', api_courses.get_course),

    # Legacy routes

    path('api/members', api_members_old.get_members),
    path('api/members/<uuid:pk>/profile',
         api_members_old.post_update_member_profile),
    path('api/members/delete/<uuid:pk>', api_members_old.post_delete_member),
    path('api/members/<uuid:pk>/licences', api_members_old.get_member_licences),
    path('api/members/<uuid:pk>/licences/add',
         api_members_old.post_add_member_licence),
    path('api/members/<uuid:pk>/notes/add',
         api_members_old.post_add_member_note),
    path('api/members/<uuid:pk>/courses/add',
         api_members_old.post_add_member_to_course),
    path('api/members/<uuid:pk>/courses/remove',
         api_members_old.post_remove_member_from_course),
    path('api/members/<uuid:pk>/deactivate',
         api_members_old.post_mark_member_inactive),
    path('api/members/<uuid:pk>/activate',
         api_members_old.post_mark_member_active),

    # Admin routes
    path('api/clubs', api_admin.get_clubs),
    path('api/clubs/create', api_admin.create_club),
    path('api/clubs/<uuid:club_uuid>/create_user', api_admin.create_club_user),
    path('api/clubs/<uuid:club_uuid>/users/create', api_admin.create_club_user),
    path('api/users/create', api_admin.create_member_user),
    path('api/users/<uuid:user_uuid>/delete', api_admin.delete_user),
]

if settings.DEBUG:
    from silk import urls as silk_urls

    urlpatterns += [path('silk/', include(silk_urls))]
