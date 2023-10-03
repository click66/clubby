import os

from jose import jwt
from time import time

PRIV_PATH = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), '../_certs/test.key')
CERT_PATH = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), '../_certs/test.cer')


def make_token(data: dict, key_path: str):
    with open(key_path, 'r') as f:
        privkey = f.read()
        return jwt.encode(data, privkey, algorithm='RS256')


def headers(data: dict = {'userUuid': 'f838b5a3-0190-4ff1-a53a-54b870d1cf6a'}, admin=True, expired=False, key_path = PRIV_PATH):
    data['isStaff'] = admin
    data['expires'] = time() + 86400
    return {'Authorization': f'Bearer {make_token(data, key_path)}'}
