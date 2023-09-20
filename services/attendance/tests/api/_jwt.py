import os

from jose import jwt

PRIV_PATH = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), '../_certs/test.key')
CERT_PATH = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), '../_certs/test.cer')


def make_token(data: dict, key_path: str):
    with open(key_path, 'r') as f:
        privkey = f.read()
        return jwt.encode(data, privkey, algorithm='RS256')


def headers(data: dict = {}, key_path = PRIV_PATH):
    return {'Authorization': f'Bearer {make_token(data, key_path)}'}
