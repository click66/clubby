import random
import uuid
from functools import reduce

from .models.session import Type

def _uuid_from_slug(slug: str, rnd: random.Random=None) -> uuid.UUID:
    rnd = rnd or random.Random()
    rnd.seed(slug)
    return uuid.UUID(int=rnd.getrandbits(128), version=4)


def session_type_from_slug(slug: str) -> Type:
    rnd = random.Random()
    match slug:
        case 'tjjf_jj_gi' | 'tjjf_jj_gi_adult' | 'tjjf_jj_gi_junior':
            slug = 'tjjf_jj_gi'
            return Type.make(
                label='Standard Jiu Jitsu (Mon/Thur)',
                uuid=_uuid_from_slug(slug, rnd),
                discriminator=lambda d: d.weekday() in [0, 3],  # Runs every Monday and Thursday
            )
        case _:
            return KeyError('Invalid session type slug passed; unrecognised or unregistered session type')


def get_session_type(uuid: uuid.UUID) -> Type:
    attempt = lambda slug: session_type_from_slug(slug) if uuid == _uuid_from_slug(slug) else None

    for slug in ['tjjf_jj_gi', 'tjjf_jj_gi_adult', 'tjjf_jj_gi_unior']:
        check = attempt(slug)
        if check:
            return check
    
    return None
