from datetime import date
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.template.defaulttags import register
from ..models import Student, Session
from ..services import session_type_from_slug

@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)


@login_required(login_url='/auth/login')
def members(request):
    return render(request, 'members.html')


def member(request, pk):
    try:
        s = Student.objects.get(uuid=pk)
    except Student.DoesNotExist:
        return redirect('members')

    today = date.today()

    classes = [session_type_from_slug('tjjf_jj_gi')]

    return render(request, 'member.html', {
        'student': s,
        'classes': dict(map(lambda sess_type: (str(sess_type.uuid), sess_type), classes)),
        'notes': s.get_last_notes(5),
        'payments': s.get_unused_payments(),
        'payments_historical': s.get_last_payments(30),
        'next_class_dates': dict(map(lambda sess_type: (str(sess_type.uuid), Session.gen_next(today, sess_type).date), classes)),
        'prospective_licence_expiry': today.replace(year=today.year + 1).strftime('%Y-%m-%d'),
    })
