from django.urls import path
from .controllers import auth
from .views import home, pay, licences, history, profiles

urlpatterns = [
    path('', home, name='home'),
    path('profiles', profiles, name='profiles'),
    path('licences', licences, name='licences'),
    path('pay', pay, name='pay'),
    path('history', history, name='history'),

    path('auth/register', auth.register),
    path('activate/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/',
         auth.activate, name='auth.activate'),
    path('auth/login', auth.login),
    path('auth/logout', auth.logout),
]
