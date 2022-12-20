import json

from datetime import date, timedelta
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from ..models.session import Session, Type
from ..services import get_session_type, session_type_from_slug


@login_required(login_url='/auth/login')
def attendance_home(request):
    return redirect('attendance', st_uuid=session_type_from_slug('tjjf_jj_gi').uuid)


@login_required(login_url='/auth/login')
def attendance(request, st_uuid):
    # Class register, showing historical class records and allowing registry of students into the current class
    class_type = get_session_type(st_uuid)

    if class_type is None:
        return redirect('home')

    today = date.today()
    classes = Session.gen(today - timedelta(days=365), today, class_type)

    classes = [{'d': c.date.isoformat()} for c in classes]
    return render(request, 'attendance.html', {
        'dataClasses': json.dumps(classes),
        'class': class_type,
        'classes': classes,
    })
