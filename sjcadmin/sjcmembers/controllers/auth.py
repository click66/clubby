from ...sjcauth.tokens import account_activation_token
from ...sjcauth.forms import RegisterForm
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import EmailMessage
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
import django.contrib.auth as auth


def login(request):
    if request.user.is_authenticated:
        return redirect('home')

    context = {
        'message': request.GET.get('message'),
        'error': request.GET.get('error'),
    }
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = auth.authenticate(request, username=username, password=password)
        if user:
            auth.login(request, user)
            return redirect('home')
        else:
            context['error'] = 'invalid_login'

    messages = {
        'invalid_activation_link': 'Registration link invalid',
        'account_activated': 'Your account has been activated successfully. Please sign in.',
        'account_activation_sent': 'An email has been sent containing a link to activate your account.',
        'invalid_login': 'Invalid login credentials',
    }
    context['message'] = messages.get(context['message'], context['message'])
    context['error'] = messages.get(context['error'], context['error'])

    return render(request, 'sjcmembers/auth/login.html', context)


def logout(request):
    auth.logout(request)
    return redirect('home')


def register(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.is_active = False
            user.save()
            current_site = get_current_site(request)
            subject = 'Activate Your Account'
            message = render_to_string('sjcmembers/email/account_activation.html', {
                'user': user,
                'domain': current_site.domain,
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': account_activation_token.make_token(user),
            })
            to_email = form.cleaned_data.get('email')
            email = EmailMessage(subject, message, to=[to_email])
            email.send()
            return redirect('/auth/login?message=account_activation_sent')
    else:
        form = RegisterForm()
    return render(request, 'sjcmembers/auth/register.html', {'form': form})


def activate(request, uidb64, token):
    try:
        uid = int(urlsafe_base64_decode(uidb64))
        user = auth.get_user_model().objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, auth.get_user_model().DoesNotExist):
        user = None

    if user is not None and account_activation_token.check_token(user, token):
        user.is_active = True
        user.save()
        return redirect('/auth/login?message=account_activated')
    else:
        return redirect('/auth/login?error=invalid_activation_link')
