from django.shortcuts import render


def home(request):
    return render(request, 'sjcmembers/home.html')


def profiles(request):
    return render(request, 'sjcmembers/profiles.html')


def history(request):
    return render(request, 'sjcmembers/history.html')


def licences(request):
    return render(request, 'sjcmembers/licences.html')


def pay(request):
    return render(request, 'sjcmembers/pay.html')
