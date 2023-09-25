import base64
import json
import os
import time

from jose import jwt

import django.contrib.auth as auth
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from ._middleware import handle_error
from ....sjcauth.models import User


@require_http_methods(['POST'])
@handle_error
@csrf_exempt
def get_jwt(request):
    private_key = base64.b64decode(os.getenv('PRIV_KEY'))

    expires = time.time() + (12 * 60 * 60)

    data = {
        'user_uuid': str(request.user.uuid),
        'tenant_uuid': str(request.user.tenant_uuid),
        'expires': expires,
    }

    token = jwt.encode(data, private_key, algorithm='RS256')

    refresh_token = jwt.encode({
        'user_uuid': str(request.user.uuid),
        'expires': time.time() + (3 * 24 * 60 * 60),
    }, private_key, algorithm='RS256')

    return JsonResponse({'success': {'token': token, 'expires': expires, 'refresh_token': refresh_token}})


@require_http_methods(['POST'])
@csrf_exempt
@handle_error
def login(request):
    data = json.loads(request.body)
    username = data.get('email')
    password = data.get('password')

    user = auth.authenticate(username=username, password=password)

    if user is not None:
        auth.login(request, user)
        return get_jwt(request)

    return JsonResponse({'error': 'Invalid credentials'})


@require_http_methods(['POST'])
@csrf_exempt
@handle_error
def refresh_token(request):
    data = json.loads(request.body)
    token = data.get('token', '')

    public_key = base64.b64decode(os.getenv('PUB_KEY'))

    decrypted = jwt.decode(token, public_key)

    if 'expires' in decrypted and decrypted['expires'] <= time.time():
        return JsonResponse({'error', 'Unauthorised'})
    
    user = User.fetch_by_uuid(decrypted.get('user_uuid'))
    
    if user is not None:
        auth.login(request, user)
        return get_jwt(request)
    
    return JsonResponse({'error': decrypted.get('user_uuid')})
