import os
import urllib

from fastapi import FastAPI, Response
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from src.database import db_url
from src.schemas.attendance import AttendancePost, AttendanceQuery, AttendanceRead
from src.middleware.jwt_auth import JWTAuthorisation, JWTConfig
from src.models.attendance import Attendance, Resolution


def is_local():
    return os.getenv('ENVIRONMENT_NAME') == 'local'


CERT_PATH = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), 'certs/test_auth.cer' if is_local() else 'certs/api_auth.cer')

app = FastAPI()

sa_engine = create_engine(db_url(os.getenv('PGHOST'), urllib.parse.quote_plus(os.getenv('PGPASS'))))
session = Session(sa_engine)

app.add_middleware(JWTAuthorisation, config=JWTConfig(
    cert_path=CERT_PATH, algorithms=['RS256']))


@app.post('/attendance/query')
async def get_attendance(query: AttendanceQuery) -> list[AttendanceRead]:
    return session.scalars(select(Attendance).where(Attendance.student_uuid.in_(query.student_uuids),
                                                    Attendance.course_uuid == query.course_uuid,
                                                    Attendance.date >= query.date_earliest,
                                                    Attendance.date <= query.date_latest)).all()


@app.post('/attendance/create')
async def post_attendance(post: AttendancePost) -> AttendanceRead:
    create = Attendance(student_uuid=post.student_uuid,
                        course_uuid=post.course_uuid,
                        date=post.date)

    match (post.resolution):
        case 'paid':
            create.resolution = Resolution(paid=True)
        case 'comp':
            create.resolution = Resolution(complementary=True)

    session.add(create)
    session.commit()

    return create


@app.post('/attendance/delete')
async def delete_by_query(query: AttendanceQuery) -> Response:
    session.query(Attendance).filter(Attendance.student_uuid.in_(query.student_uuids),
                                     Attendance.course_uuid == query.course_uuid,
                                     Attendance.date >= query.date_earliest,
                                     Attendance.date <= query.date_latest).delete()
    session.commit()
    return Response(status_code=204)
