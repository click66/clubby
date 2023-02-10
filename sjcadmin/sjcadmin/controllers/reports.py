from datetime import date, datetime, timedelta
import csv

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from ..models.attendance import Attendance
from ..models.course import Course
from ..models.session import Session
from ..models.student import Student


@login_required(login_url='/auth/login')
def reports(request):
    products = [(c.uuid, c.label) for c in Course.fetch_all()]

    return render(request, 'sjcadmin/reports.html', {
        'attendance_default_earliest': (datetime.now().date() - timedelta(days=90)).isoformat(),
        'attendance_default_latest': datetime.now().date().isoformat(),
        'products': products,
    })


@login_required(login_url='/auth/login')
@require_http_methods(['POST'])
def attendance_download(request):
    def _marker(a):
        return "\u2713" + (' P' if a.has_paid else ' F' if a.is_complementary else '')

    course = Course.fetch_by_uuid(request.POST.get('product'))
    earliest = date.fromisoformat(request.POST.get('earliest'))
    latest = date.fromisoformat(request.POST.get('latest'))

    attendances = (a for a in Attendance.fetch_for_course(course, earliest, latest))
    students = (s for s in Student.fetch_signed_up_for(course))
    classes = Session.gen(earliest, latest, [course], exclusive=False)

    pivot = {student.name: {str(c.date): None for c in classes} for student in students}

    for a in attendances:
        pivot[a.student_name][str(a.session_date)] = _marker(a)

    response = HttpResponse(content_type='text/csv', headers={'Content-Disposition': 'attachment; filename="report.csv"'})
    writer = csv.writer(response)

    header = ['name'] + [str(c.date) for c in classes]
    writer.writerow(header)

    for name, values in sorted(pivot.items()):
        row = [name] + [values.get(str(c.date), '') for c in classes]
        writer.writerow(row)

    return response
