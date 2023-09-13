import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from src.database import db_url
from src.models.attendance import Attendance

sa_engine = create_engine(db_url(os.getenv('PGHOST'), os.getenv('PGPASS')))
session = Session(sa_engine)


def seed_database(attendances: Attendance):
    # Purge all existing models
    session.query(Attendance).delete()

    # Seed with supplied models
    if len(attendances) > 0:
        session.add_all(attendances)
    session.commit()
