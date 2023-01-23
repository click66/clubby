import django.contrib.auth as auth
from django.shortcuts import redirect, render, reverse


def login(request):
    if request.user.is_authenticated:
        return redirect('home')

    error = None

    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = auth.authenticate(username=username, password=password)

        if user is not None:
            auth.login(request, user)
            return redirect('home')

        error = 'invalid_password'

    return render(request, 'sjcadmin/auth/login.html', {'error': error})


def logout(request):
    auth.logout(request)
    return redirect('home')
