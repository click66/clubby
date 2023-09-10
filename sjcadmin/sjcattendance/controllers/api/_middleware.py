from django.core.exceptions import ValidationError
from django.http import JsonResponse
from functools import wraps

from ...errors import DomainError


def handle_error(function=None):
    @wraps(function)
    def inner(request, *args, **kwargs):
        try:
            return function(request, *args, **kwargs)
        except (DomainError, ValueError, ValidationError) as e:
            return JsonResponse({'error': str(e)})

    return inner
