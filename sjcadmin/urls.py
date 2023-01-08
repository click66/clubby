"""sjcadmin URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from .controllers.api import attendance as api_attendance, members as api_members

from .controllers import attendance, auth, home, members

urlpatterns = [
    path('admin/', admin.site.urls),

    path('auth/login', auth.login),
    path('auth/logout', auth.logout),

    path('', home.home, name='home'),

    path('members', members.members, name='members'),
    path('members/<uuid:pk>', members.member, name='member'),

    path('attendance', attendance.attendance, name='attendance'),

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
]
