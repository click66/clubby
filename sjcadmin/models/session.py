from datetime import date, timedelta
from typing import Callable
from uuid import UUID, uuid4


class Type:
    def __init__(self, uuid: UUID, label: str, discriminator: Callable):
        self._uuid = uuid
        self._label = label
        self._discriminator = discriminator
    
    def __str__(self):
        return self._label

    @classmethod
    def make(cls, label: str, discriminator: Callable, uuid: UUID=None):
        return Type(
            uuid=uuid or uuid4(),
            label=label,
            discriminator=discriminator,
        )
    
    @property
    def uuid(self):
        return self._uuid

    @property
    def label(self):
        return self._label

    @property
    def is_session_date(self):
        return self._discriminator


class Session:
    def __init__(self, sess_date):
        self._sess_date = sess_date

    @classmethod
    def make(cls, sess_date: date):
        return Session(sess_date)

    @classmethod
    def gen(cls, start: date, end: date, type: Type):
        days = (end - timedelta(days=i) for i in range((end-start).days - 1))
        return [cls.make(sess_date=d) for d in days if type.is_session_date(d)]
    
    @classmethod
    def gen_next(cls, start: date, type: Type):
        while not type.is_session_date(start):
            start += timedelta(days=1)
        return cls.make(sess_date=start)

    @property
    def date(self):
        return self._sess_date
