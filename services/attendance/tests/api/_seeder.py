import os
import requests

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from uuid import UUID

from src.database import db_url
from src.models.attendance import Attendance
from ._jwt import headers

sa_engine = create_engine(db_url(os.getenv('PGHOST'), os.getenv('PGPASS')))
session = Session(sa_engine)

USER_UUID = 'f838b5a3-0190-4ff1-a53a-54b870d1cf6a'


def seed_attendances(attendances: Attendance):
    # Purge all existing models
    session.query(Attendance).delete()

    # Seed with supplied models
    if len(attendances) > 0:
        session.add_all(attendances)
    session.commit()


def seed_member(member: dict) -> UUID:
    return UUID(requests.post('http://monolith.southamptonjiujitsu.local:8000/api/members/add',
                              json=member,
                              headers=headers({
                                  'user_uuid': USER_UUID,
                              }),
                              ).json().get('success').get('uuid'))


def seed_course(course: dict) -> UUID:
    return UUID(requests.post('http://monolith.southamptonjiujitsu.local:8000/api/courses/add',
                              json=course,
                              headers=headers({
                                  'user_uuid': USER_UUID,
                              }),
                              ).json().get('success').get('uuid'))