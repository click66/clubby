import json

from datetime import date, timedelta
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from ..models.session import Session


@login_required(login_url='/auth/login')
def attendance(request):
    # Class register, showing historical class records and allowing registry of students into the current class
    today = date.today()
    classes = Session.gen(today - timedelta(days=365), today, lambda d: d.weekday() in [0, 3])

    classes = [{'d': c.date.isoformat()} for c in classes]
    return render(request, 'attendance.html', {
        'dataClasses': json.dumps(classes),
        'classes': classes,
    })
