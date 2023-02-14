from django.contrib.auth.decorators import login_required
from django.shortcuts import render


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
    return render(request, 'sjcmembers/licences.html')


@login_required(login_url='/auth/login')
def pay(request):
    return render(request, 'sjcmembers/pay.html')
