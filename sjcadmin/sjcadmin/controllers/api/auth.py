import base64
import json
import os
import secrets
import time

import django.contrib.auth as auth
from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from jose import jwt
from rest_framework import serializers
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ._middleware import handle_error, login_required_401
from ...schemas import BaseSerialiser
from ....sjcauth.models import ActivationCode, User


@require_http_methods(['POST'])
@api_view(['POST'])
@handle_error
def login(request):
    data = json.loads(request.body)
    username = data.get('email')
    password = data.get('password')

    user = auth.authenticate(username=username, password=password)

    if user is not None:
        auth.login(request, user)
        return get_jwt(request)

    return JsonResponse({'error': 'Invalid credentials'}, status=401)


@require_http_methods(['POST'])
@api_view(['POST'])
@handle_error
def refresh_token(request):
    data = json.loads(request.body)
    token = data.get('token', '')

    public_key = base64.b64decode(os.getenv('PUB_KEY'))

    decrypted = jwt.decode(token, public_key)

    if 'expires' in decrypted and decrypted['expires'] <= time.time():
        return JsonResponse({'error', 'Unauthorised'}, 401)

    user = User.fetch_by_uuid(decrypted.get('userUuid'))

    if user is not None:
        auth.login(request, user)
        return get_jwt(request)

    return JsonResponse({'error': 'Unauthorised'}, 401)


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


class RegistrationSerializer(BaseSerialiser):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    domain = serializers.CharField()


class ActivationSerializer(BaseSerialiser):
    code = serializers.CharField(max_length=255)


class LoginToken(BaseSerialiser):
    token = serializers.CharField()
    refresh_token = serializers.CharField()
    expires = serializers.FloatField()


class UserSerialiser(BaseSerialiser):
    uuid = serializers.UUIDField()
    name = serializers.CharField()


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

    return Response(LoginToken({
        'token': token,
        'expires': expires,
        'refresh_token': refresh_token,
    }).data)


@api_view(['POST'])
def register(request):
    serializer = RegistrationSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        domain = serializer.validated_data['domain']

        if password != serializer.validated_data['confirm_password']:
            return Response({'error': 'Passwords do not match.'})

        try:
            user = User.objects.create_user(
                email=email, is_staff=False, password=password, is_active=False)
        except IntegrityError:
            return Response({'error': 'This email address is already in use.'})

        def generate_activation_code():
            return secrets.token_urlsafe(30)

        activation_code = generate_activation_code()
        ActivationCode.objects.create(
            user=user, activation_code=activation_code)

        subject = 'Activate Your Account'
        message = f'Please click the link below to activate your account:\n\n{domain}/auth/activate/{user.uuid}/?code={activation_code}'

        send_mail(subject, message, settings.EMAIL_HOST_USER,
                  [user.email], fail_silently=False)

        return Response({'success': 'Account created. Check your email for activation instructions.'}, status=201)

    return Response(serializer.errors, status=400)


@api_view(['POST'])
def activate_account(request, user_uuid: str):
    serializer = ActivationSerializer(data=request.data)
    if serializer.is_valid():
        user = get_object_or_404(
            User, _uuid=user_uuid, is_active=False)
        activation_code = get_object_or_404(
            ActivationCode, user=user, activation_code=serializer.validated_data['code'])

        user.is_active = True
        user.save()

        activation_code.delete()

        return Response({'success': 'Account activated successfully.'})

    return Response(serializer.errors)


@api_view(['GET'])
@login_required_401
def me(request):
    return Response(UserSerialiser(request.user).data, status=200)
