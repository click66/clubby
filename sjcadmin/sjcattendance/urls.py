from django.urls import path

from .controllers.api import attendance as api_attendance

urlpatterns = [
    path('', api_attendance.dispatch, name='api_attendance'),
    path('<int:pk>', api_attendance.delete_attendance, name='api_attendance_delete'),
    path('delete', api_attendance.delete_by_criteria, name='api_attendance_delete_by_criteria'),
]
