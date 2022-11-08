from datetime import date
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from ..models import Student


@login_required(login_url='/auth/login')
def members(request):
    return render(request, 'members.html')


def member(request, pk):
    try:
        s = Student.objects.get(uuid=pk)
    except Student.DoesNotExist:
        return redirect('members')

    today = date.today()

    return render(request, 'member.html', {
        'student': s,
        'prospective_licence_expiry': today.replace(year=today.year + 1).strftime('%Y-%m-%d'),
    })
