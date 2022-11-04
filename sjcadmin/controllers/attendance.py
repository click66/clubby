import json

from datetime import date, timedelta
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render, reverse
from ..models.attendance import Attendance
from ..models.session import Session
from ..models.student import Student


@login_required(login_url='/auth/login')
def attendance(request):
    # Class register, showing historical class records and allowing registry of students into the current class
    today = date.today()
    classes = Session.gen(today - timedelta(days=365), today, lambda d: d.weekday() in [0, 3])

    students = {str(s.uuid): {
                                 'uuid': str(s.uuid),
                                 'name': s.name,
                                 'membership': 'trial' if not s.has_licence() else 'licenced',
                                 'rem_trial_sessions': s.remaining_trial_sessions,
                                 'attendances': [],
                                 'paid': [],
                             }
                             | ({'licence': {'no': s.licence_no, 'exp_time': s.licence_expiry_date.strftime('%d/%m/%Y'),
                                             'exp': s.is_licence_expired()}} if s.has_licence() else {})
                for s in Student.objects.all()}

    attendances = Attendance.objects.filter(date__gte=classes[-1].date)

    for a in attendances:
        students[str(a.student_id)]['attendances'].append(str(a.session_date))
        if a.has_paid:
            students[str(a.student_id)]['paid'].append(str(a.session_date))

    classes = [{'d': c.date.isoformat()} for c in classes]
    return render(request, 'attendance.html', {
        'dataStudents': json.dumps(list(students.values())),
        'dataClasses': json.dumps(classes),
        'classes': classes,
    })


def log(request):
    if not request.POST:
        redirect('home')

    student_uuid = request.POST.get('student_uuid')
    sess_date = request.POST.get('sess_date')
    paid = request.POST.get('paid')

    s = Student.objects.get(pk=student_uuid)
    a = Attendance.register_student(s, date=date.fromisoformat(sess_date))

    if paid:
        a.mark_as_paid()

    a.save()
    return redirect('attendance')
