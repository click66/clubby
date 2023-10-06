import base64
import os

import django.contrib.auth as auth
from django.http import HttpResponse, JsonResponse
from functools import wraps
from time import time

from ...errors import DomainError
from ....sjcauth.models import User

from jose import jwt


def authorise_request(request):
    auth_header = request.headers.get('Authorization', None)
    public_key = base64.b64decode(os.getenv('PUB_KEY'))

    if auth_header is not None:
        token = auth_header.replace('Bearer ', '')
        data = jwt.decode(token, public_key)

        if 'expires' not in data or data['expires'] <= time():
            return False

        if 'userUuid' in data:
            u = User.fetch_by_uuid(data.get('userUuid'))
            if not u:
                return False
            auth.login(request, u)

            return True

    return request.user.is_authenticated


def superuser_check(request):
    return request.user.is_superuser


def user_passes_test(test_func):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if test_func(request):
                return view_func(request, *args, **kwargs)
            return HttpResponse('Unauthorized', status=401)

        return _wrapped_view

    return decorator


def login_required_401(function=None):
    actual_decorator = user_passes_test(authorise_request)
    if function:
        return actual_decorator(function)
    return actual_decorator


def superuser_required_401(function=None):
    actual_decorator = user_passes_test(superuser_check)
    if function:
        return actual_decorator(function)
    return actual_decorator

def role_required(allowed_roles):
    def check_role(user: User):
        if 'staff' in allowed_roles and user.is_staff:
            return True
        
        if 'superadmin' in allowed_roles and user.is_superuser:
            return True
        
        if 'member' in allowed_roles and user.is_member_user:
            return True
        
        return False


    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if request.user.is_authenticated and not check_role(request.user):
                return HttpResponse('Unauthorized', status=401)
            
            return view_func(request, *args, **kwargs)
        
        return _wrapped_view

    return decorator

def handle_error(function=None):
    @wraps(function)
    def inner(request, *args, **kwargs):
        try:
            return function(request, *args, **kwargs)
        except Exception as e:
            return JsonResponse({'error': str(e)})

    return inner
