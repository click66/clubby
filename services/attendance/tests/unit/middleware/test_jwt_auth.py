import os
from time import time

from fastapi import FastAPI
from fastapi.testclient import TestClient
from jose import jwt
from src.middleware.jwt_auth import JWTAuthorisation, JWTConfig

PRIV_PATH = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), '../../_certs/test.key')
CERT_PATH = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), '../../_certs/test.cer')

app = FastAPI()

app.add_middleware(JWTAuthorisation, config=JWTConfig(
    cert_path=CERT_PATH, algorithms=['RS256']))


@app.get('/test')
def sut():
    return {'content': 'Hello world'}


client = TestClient(app)


def _make_token(data: dict):
    with open(PRIV_PATH, 'r') as f:
        privkey = f.read()
        return jwt.encode(data, privkey, algorithm='RS256')


def test_authorised_call():
    token = _make_token({
        'userUuid': '952f3093-aec5-44ed-955e-8e84f096127e',
        'expires': time() + 86400,
        'isStaff': True,
    })
    response = client.get(
        '/test', headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 200


def test_expired_token():
    token = _make_token({
        'userUuid': '952f3093-aec5-44ed-955e-8e84f096127e',
        'expires': time() - 86400,
        'isStaff': True,
    })
    response = client.get(
        '/test', headers={'Authorization': f'Bearer {token}'})

    assert response.status_code == 401


def test_no_credentials():
    response = client.get('/test')

    assert response.status_code == 403
    assert response.json()['detail'] == 'Not authenticated'


def test_incorrect_scheme():
    response = client.get('/test', headers={'Authorization': 'Basic foobar'})

    assert response.status_code == 403
    assert response.json()['detail'] == 'Invalid authentication credentials'
