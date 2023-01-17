from datetime import date
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.template.defaulttags import register
from ..models import Course, Student, Session


@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)


@login_required(login_url='/auth/login')
def members(request):
    return render(request, 'members.html')


@login_required(login_url='/auth/login')
def member(request, pk):
    try:
        s = Student.fetch_by_uuid(pk)
    except Student.DoesNotExist:
        return redirect('members')

    today = date.today()

    classes = s.courses

    return render(request, 'member.html', {
        'student': s,
        'classes': dict(map(lambda sess_type: (str(sess_type.uuid), sess_type), classes)),
        'notes': s.get_last_notes(5),
        'payments': list(map(lambda p: {
            "time": p.time,
            "course": p.course,
            "next_session_date": Session.gen_next(today, p.course).date,
        }, s.get_unused_payments())),
        'payments_historical': s.get_last_payments(30),
        'prospective_licence_expiry': today.replace(year=today.year + 1).strftime('%Y-%m-%d'),
    })
