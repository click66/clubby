import json

from collections import defaultdict
from datetime import date, timedelta
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from functools import reduce
from ..models.session import Session
from ..models.course import Course


@login_required(login_url='/auth/login')
def attendance(request):
    # Class register, showing historical class records and allowing registry of students into the current class
    today = date.today()
    courses = Course.objects.all()
    classes = Session.gen(today - timedelta(days=365),
                          today, courses, exclusive=False)
    classes.reverse()

    unique_classes = defaultdict(list)

    for c in classes:
        unique_classes[c.date.isoformat()].append(str(c.course_uuid))

    return render(request, 'attendance.html', {
        'classes': dict(unique_classes),
        'dataClasses': json.dumps(unique_classes),
        'courses': courses,
        'dataCourses': json.dumps(dict(map(lambda c: (str(c.uuid), c.label), courses))),
    })
