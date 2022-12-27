from django.contrib import admin
from .models.student import Licence, Student, Payment
from .models.attendance import Attendance
from .models.course import Course

admin.site.register(Licence)
admin.site.register(Student)
admin.site.register(Attendance)
admin.site.register(Payment)
admin.site.register(Course)