from datetime import date, timedelta
from typing import Callable


class Session:
    def __init__(self, sess_date):
        self.sess_date = sess_date

    @classmethod
    def make(cls, sess_date: date):
        return Session(sess_date)

    @classmethod
    def gen(cls, start: date, end: date, discriminator: Callable):
        days = (end - timedelta(days=i) for i in range((end-start).days - 1))
        return [cls.make(sess_date=d) for d in days if discriminator(d)]

    @property
    def date(self):
        return self.sess_date

