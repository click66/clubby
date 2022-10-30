from django.contrib import admin
from .models.student import Licence, Student
from .models.attendance import Attendance

admin.site.register(Licence)
admin.site.register(Student)
admin.site.register(Attendance)