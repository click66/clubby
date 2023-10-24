import base64
import json
import os
import time

from jose import jwt

import django.contrib.auth as auth
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from ._middleware import handle_error, login_required_401
from ....sjcauth.models import User


@require_http_methods(['POST'])
@handle_error
def get_jwt(request):
    private_key = base64.b64decode(os.getenv('PRIV_KEY'))

    expires = time.time() + (12 * 60 * 60)

    data = {
        'userUuid': str(request.user.uuid),
        'tenantUuid': str(request.user.tenant_uuid),
        'isStaff': request.user.is_staff,
        'isSuperuser': request.user.is_superuser,
        'expires': expires,
    }

    token = jwt.encode(data, private_key, algorithm='RS256')

    refresh_token = jwt.encode({
        'userUuid': str(request.user.uuid),
        'expires': time.time() + (3 * 24 * 60 * 60),
    }, private_key, algorithm='RS256')

    return JsonResponse({'success': {'token': token, 'expires': expires, 'refreshToken': refresh_token}})


@require_http_methods(['POST'])
@handle_error
def login(request):
    data = json.loads(request.body)
    username = data.get('email')
    password = data.get('password')

    user = auth.authenticate(username=username, password=password)

    if user is not None and user.is_staff is True:
        auth.login(request, user)
        return get_jwt(request)

    return JsonResponse({'error': 'Invalid credentials'})


@require_http_methods(['POST'])
@handle_error
def refresh_token(request):
    data = json.loads(request.body)
    token = data.get('token', '')

    public_key = base64.b64decode(os.getenv('PUB_KEY'))

    decrypted = jwt.decode(token, public_key)

    if 'expires' in decrypted and decrypted['expires'] <= time.time():
        return JsonResponse({'error', 'Unauthorised'})

    user = User.fetch_by_uuid(decrypted.get('userUuid'))

    if user is not None:
        auth.login(request, user)
        return get_jwt(request)

    return JsonResponse({'error': decrypted.get('userUuid')})


@login_required_401
@require_http_methods(['POST'])
@handle_error
def change_password(request):
    data = json.loads(request.body)

    existing_password = data.get('existingPassword', '')
    new_password = data.get('newPassword', '')
    confirm_new_password = data.get('confirmNewPassword', '')

    if new_password != confirm_new_password:
        return JsonResponse({'error': 'New passwords do not match'})

    if new_password == '':
        return JsonResponse({'error': 'New password cannot be empty'})

    u = User.fetch_by_uuid(request.user._uuid)
    if not u.check_password(existing_password):
        return JsonResponse({'error': 'Existing password was incorrect'})

    u.set_password(new_password)
    u.save()

    return JsonResponse({'success': None})
