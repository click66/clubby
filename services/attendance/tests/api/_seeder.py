import os
import requests

from faker import Faker
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from uuid import UUID

from src.database import db_url
from src.models.attendance import Attendance
from ._jwt import headers

fake = Faker()
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
    return UUID(requests.post('http://monolith.southamptonjiujitsu.local:8000/api/members/create',
                              json=member,
                              headers=headers({
                                  'userUuid': USER_UUID,
                              }),
                              ).json().get('uuid'))


def seed_member_payment(member_uuid: str, course_uuid: str):
    requests.post(f'http://monolith.southamptonjiujitsu.local:8000/api/members/{member_uuid}/payments/add',
                             json={
                                 'course': {'uuid': str(course_uuid)},
                             }, headers=headers({
                                 'userUuid': USER_UUID,
                             }))


def seed_member_subscription(member_uuid: str, course_uuid: str, expiry_date: str):
    requests.post(f'http://monolith.southamptonjiujitsu.local:8000/api/members/{member_uuid}/subscriptions/add',
                             json={
                                 'course': {'uuid': str(course_uuid)},
                                 'type': 'time',
                                 'expiryDate': expiry_date,
                             }, headers=headers({
                                 'userUuid': USER_UUID,
                             }))


def seed_course(course: dict) -> UUID:
    return UUID(requests.post('http://monolith.southamptonjiujitsu.local:8000/api/courses/create',
                              json=course,
                              headers=headers({
                                  'userUuid': USER_UUID,
                              }),
                              ).json().get('uuid'))


def seed_user(email: str) -> UUID:
    return UUID(requests.post('http://monolith.southamptonjiujitsu.local:8000/api/users/create',
                              json={
                                  'email': email,
                              },
                              headers=headers({
                                  'userUuid': USER_UUID,
                                  'isStaff': True,
                              }),
                              ).json().get('success').get('uuid'))


def read_member_payments(uuid: UUID):
    return requests.get(f'http://monolith.southamptonjiujitsu.local:8000/api/members/{uuid}/payments',
                        headers=headers({
                            'userUuid': USER_UUID,
                            'isStaff': True,
                        })).json()


def delete_user(uuid: UUID):
    requests.post(f'http://monolith.southamptonjiujitsu.local:8000/api/users/{uuid}/delete',
                  headers=headers({
                      'userUuid': USER_UUID,
                      'isStaff': True,
                  }))


def delete_course(uuid: UUID):
    requests.post(f'http://monolith.southamptonjiujitsu.local:8000/api/courses/{uuid}/delete',
                  headers=headers({
                      'userUuid': USER_UUID,
                      'isStaff': True,
                  }))


def delete_member(uuid: UUID):
    requests.post(f'http://monolith.southamptonjiujitsu.local:8000/api/members/{uuid}/delete',
                  headers=headers({
                      'userUuid': USER_UUID,
                      'isStaff': True,
                  }))
