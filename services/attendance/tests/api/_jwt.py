
import os

from jose import jwt

PRIV_PATH = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), '../_certs/test.key')
CERT_PATH = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), '../_certs/test.cer')


def make_token(data: dict):
    with open(PRIV_PATH, 'r') as f:
        privkey = f.read()
        return jwt.encode(data, privkey, algorithm='RS256')


def headers(data: dict = {}):
    return {'Authorization': f'Bearer {make_token(data)}'}
