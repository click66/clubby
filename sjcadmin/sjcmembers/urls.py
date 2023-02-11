from django.urls import path
from .controllers import auth
from .views import home, pay, licences, history, profiles

urlpatterns = [
    path('', home, name='home'),
    path('profiles', profiles, name='profiles'),
    path('licences', licences, name='licences'),
    path('pay', pay, name='pay'),
    path('history', history, name='history'),

    path('auth/register', auth.register_view),
    path('auth/login', auth.login_view),
    path('auth/logout', auth.logout_view),
]
