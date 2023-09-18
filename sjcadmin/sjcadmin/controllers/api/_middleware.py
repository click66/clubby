import base64
import json
import os

import django.contrib.auth as auth
from django.core.exceptions import ValidationError
from django.http import HttpResponse, JsonResponse
from functools import wraps

from ...errors import DomainError
from ....sjcauth.models import User

from jose import jwt


def authorise_request(request):
    auth_header = request.headers.get('Authorization', None)
    private_key = base64.b64decode(os.getenv('PRIV_KEY'))

    if auth_header is not None:
        token = auth_header.replace('Bearer ', '')
        data = jwt.decode(token, private_key)
        if data.get('user_uuid', None) is not None:
            u = User.fetch_by_uuid(data.get('user_uuid'))
            if not u: return False
            auth.login(request, u)

            return True

    return request.user.is_authenticated


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


def handle_error(function=None):
    @wraps(function)
    def inner(request, *args, **kwargs):
        try:
            return function(request, *args, **kwargs)
        except (DomainError, ValueError, ValidationError) as e:
            return JsonResponse({'error': str(e)})

    return inner
