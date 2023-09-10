from django.urls import include, path
from ..sjcattendance import urls as attendance_urls

urlpatterns = [
    path('attendance/', include(attendance_urls)),
]
