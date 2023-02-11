from datetime import date
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.template.defaulttags import register
from ..models import Student, Session
from ...sjcauth.models import User


@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)


@login_required(login_url='/auth/login')
def members(request):
    return render(request, 'sjcadmin/members.html')


@login_required(login_url='/auth/login')
def member(request, pk):
    def _username(uuid) -> str: 
        u = User.fetch_by_uuid(uuid)
        if u:
            return u.email
        return 'Anonymous User'

    try:
        s = Student.fetch_by_uuid(pk)
    except Student.DoesNotExist:
        return redirect('members')

    today = date.today()

    classes = s.courses

    return render(request, 'sjcadmin/member.html', {
        'student': s,
        'added_by': _username(s.added_by),
        'classes': dict(map(lambda sess_type: (str(sess_type.uuid), sess_type), classes)),
        'notes': list(map(lambda n: {
            "author_name": _username(n.author),
            "time": n.time,
            "text": n.text,
        }, s.get_last_notes(5))),
        'payments': list(map(lambda p: {
            "time": p.time,
            "course": p.course,
            "next_session_date": Session.gen_next(today, p.course).date,
        }, s.get_unused_payments())),
        'payments_historical': s.get_last_payments(30),
        'prospective_licence_expiry': today.replace(year=today.year + 1).strftime('%Y-%m-%d'),
    })
