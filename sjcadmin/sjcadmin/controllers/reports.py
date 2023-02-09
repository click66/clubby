from collections import defaultdict
from datetime import date, datetime, timedelta
import pandas as pd

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

    attendances = Attendance.fetch_for_course(
        uuid=request.POST.get('product'),
        earliest=date.fromisoformat(request.POST.get('earliest')),
        latest=date.fromisoformat(request.POST.get('latest')),
    )

    pivot = defaultdict(dict)
    for a in attendances:
        pivot[a.student_name][str(a.session_date)] = _marker(a)

    pivot = [{**a, 'name': k} for k, a in sorted(pivot.items())]

    df = pd.DataFrame(pivot).set_index('name')
    df = df.sort_index(axis=1)

    response = HttpResponse(
        content=df.to_csv(index=True),
        content_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="report.csv"'},
    )

    return response
