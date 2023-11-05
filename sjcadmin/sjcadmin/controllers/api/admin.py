import json
import secrets
import string

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from ._middleware import handle_error, login_required_401, role_required, superuser_required_401
from ....sjcauth.models import User
from ...models.tenant import Tenant


@require_http_methods(['GET'])
@login_required_401
@role_required(['superadmin'])
@superuser_required_401
@handle_error
def get_clubs(request):
    clubs = Tenant.objects.all()

    return JsonResponse({'success': list(map(lambda club: {
        'uuid': club.uuid,
        'name': club.name,
    }, clubs))})


@require_http_methods(['POST'])
@login_required_401
@role_required(['superadmin'])
@superuser_required_401
@handle_error
def create_club(request):
    data = json.loads(request.body)

    if 'name' not in data:
        return JsonResponse({'error': 'Missing required attribute "name".'})

    t = Tenant(name=data.get('name'))
    t.save()

    return JsonResponse({'success': {
        'uuid': t.uuid,
        'name': t.name,
    }})


@require_http_methods(['POST'])
@login_required_401
@role_required(['superadmin'])
@superuser_required_401
@handle_error
def create_club_user(request, club_uuid):
    data = json.loads(request.body)

    email = data.get('email')
    is_staff = data.get('isStaff')

    def generate_secure_password(length=10):
        characters = string.ascii_letters + string.digits + string.punctuation
        secure_password = ''.join(secrets.choice(characters)
                                  for _ in range(length))
        return secure_password

    password = generate_secure_password()

    u = User.objects.create_user(
        email=email, is_staff=is_staff, password=password, club_uuid=club_uuid)

    return JsonResponse({'success': {
        'uuid': u.uuid,
        'password': password,
    }})


@require_http_methods(['POST'])
@login_required_401
@role_required(['superadmin'])
@superuser_required_401
@handle_error
def create_member_user(request):
    data = json.loads(request.body)

    email = data.get('email')

    def generate_secure_password(length=10):
        characters = string.ascii_letters + string.digits + string.punctuation
        secure_password = ''.join(secrets.choice(characters)
                                  for _ in range(length))
        return secure_password

    password = generate_secure_password()

    u = User.objects.create_user(
        email=email, is_staff=False, password=password)

    return JsonResponse({'success': {'uuid': u.uuid, 'password': password}})


@require_http_methods(['POST'])
@login_required_401
@role_required(['superadmin'])
@superuser_required_401
@handle_error
def delete_user(request, user_uuid):
    User.objects.filter(_uuid=user_uuid).delete()
    return JsonResponse({'success': user_uuid}, status=200)
