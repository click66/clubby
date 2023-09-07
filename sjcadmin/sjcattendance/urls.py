from django.urls import path

from .controllers.api import attendance as api_attendance

urlpatterns = [
    path('', api_attendance.get_attendance, name='api_get_attendance'),
]
