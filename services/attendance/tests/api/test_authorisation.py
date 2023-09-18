import os
import requests

from src.models.attendance import Attendance, Resolution
from ._jwt import headers

API_ROOT = 'http://localhost:8000'
API_URL = f'{API_ROOT}/attendance/test'


def test_valid_token():
    # When I send a GET request with a valid token
    response = requests.get(API_URL, headers=headers())

    # Then the query returns 404
    assert response.status_code == 404


def test_invalid_token():
    # When I send a GET request with a valid token
    response = requests.get(API_URL, headers={'Authorization': 'j3j29dj23'})

    # Then the query returns 403
    assert response.status_code == 403
