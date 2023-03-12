from datetime import datetime, timedelta
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.template.loader import get_template

from .models import Licence
from ..sjcadmin.models import Student


def find_student_licences(request):
    licences = []
    students = Student.objects.filter(profile_email=request.user.email)

    for s in students:
        licences.append(Licence(name=s.name,
                                tjjf_no=s.licence_no,
                                expiry=s.licence_expiry_date))

    return licences


@login_required(login_url='/auth/login')
def home(request):
    return render(request, 'sjcmembers/home.html')


@login_required(login_url='/auth/login')
def profiles(request):
    return render(request, 'sjcmembers/profiles.html')


@login_required(login_url='/auth/login')
def history(request):
    return render(request, 'sjcmembers/history.html')


@login_required(login_url='/auth/login')
def licences(request):
    def licence_template(licence):
        return licence.get_validity(datetime.now().date()), {
            'name': licence.name,
            'tjjf_no': licence.tjjf_no,
            'expiry': licence.expiry,
        }

    def render_licence(template, context):
        return get_template(f'sjcmembers/licences/{template}.html').render(context)

    licences = find_student_licences(request)

    return render(request, 'sjcmembers/licences.html', {
        'rendered_licences': list(map(lambda licence: render_licence(*licence_template(licence)), licences)),
    })


@login_required(login_url='/auth/login')
def pay(request):
    return render(request, 'sjcmembers/pay.html')
