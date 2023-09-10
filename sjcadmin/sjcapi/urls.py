from django.urls import include, path
from ..sjcattendance import urls as attendance_urls


def trigger_error(request):
    division_by_zero = 1 / 0


urlpatterns = [
    path('attendance/', include(attendance_urls)),
]
