import aiohttp
import os
import urllib

from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from starlette.status import HTTP_403_FORBIDDEN

from src.database import db_url
from src.errors import DomainError
from src.schemas.attendance import AttendancePost, AttendanceQuery, AttendanceRead
from src.schemas.token import Token
from src.members import HttpClient, attempt_attendance, delete_attendance, get_manageable_members
from src.middleware.jwt_auth import JWTAuthorisation, JWTConfig
from src.models.attendance import Attendance, Resolution


def is_local():
    return os.getenv('ENVIRONMENT_NAME') == 'local'


CERT_PATH = os.path.join(os.path.dirname(
    os.path.abspath(__file__)), 'certs/test_auth.cer' if is_local() else 'certs/api_auth.cer')

app = FastAPI()

sa_engine = create_engine(
    db_url(os.getenv('PGHOST'), urllib.parse.quote_plus(os.getenv('PGPASS'))))
session = Session(sa_engine)

app.add_middleware(JWTAuthorisation, config=JWTConfig(
    cert_path=CERT_PATH, algorithms=['RS256']))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:8080',
        'https://admin.southcoastjiujitsu.com',
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

monolith_client = HttpClient()


async def check_permissions(http_client: HttpClient, request, requested_member_uuids):
    token: Token = request.state.token
    is_staff = token.isStaff
    user_uuid = token.userUuid
    if is_staff is False:   # Staff can manage all members
        if requested_member_uuids <= await get_manageable_members(http_client, request, user_uuid):
            raise HTTPException(status_code=HTTP_403_FORBIDDEN,
                                detail='User is not authorised.')


@app.on_event("startup")
async def startup():
    monolith_client.start('http://monolith.southamptonjiujitsu.local:8000' if is_local()
                          else 'https://monolith.southcoastjiujitsu.com')


@app.post('/attendance/query')
async def get_attendance(query: AttendanceQuery, request: Request, http_client: aiohttp.ClientSession = Depends(monolith_client)) -> list[AttendanceRead]:
    check_permissions(http_client, request, query.student_uuids)

    return session.scalars(select(Attendance).where(Attendance.student_uuid.in_(query.student_uuids),
                                                    Attendance.course_uuid == query.course_uuid,
                                                    Attendance.date >= query.date_earliest,
                                                    Attendance.date <= query.date_latest)).all()


@app.post('/attendance/create')
async def post_attendance(post: AttendancePost, request: Request, http_client: aiohttp.ClientSession = Depends(monolith_client)) -> AttendanceRead:
    check_permissions(http_client, request, [post.student_uuid])

    create = Attendance(student_uuid=post.student_uuid,
                        course_uuid=post.course_uuid,
                        date=post.date)

    match (post.resolution):
        case 'paid':
            create.resolution = Resolution(paid=True)
        case 'comp':
            create.resolution = Resolution(complementary=True)

    try:
        await attempt_attendance(http_client, request, create, post.use_advanced_payment)
    except DomainError as e:
        raise HTTPException(status_code=422, detail=str(e))

    session.query(Attendance).filter(Attendance.student_uuid == post.student_uuid,
                                     Attendance.course_uuid == post.course_uuid,
                                     Attendance.date == post.date).delete()

    session.add(create)

    try:
        session.commit()
    except:
        session.rollback()
        raise

    return create


@app.post('/attendance/delete')
async def delete_by_query(query: AttendanceQuery, request: Request, http_client: aiohttp.ClientSession = Depends(monolith_client)) -> Response:
    check_permissions(http_client, request, query.student_uuids)

    session.query(Attendance).filter(Attendance.student_uuid.in_(query.student_uuids),
                                     Attendance.course_uuid == query.course_uuid,
                                     Attendance.date >= query.date_earliest,
                                     Attendance.date <= query.date_latest).delete()

    try:
        session.commit()
    except:
        session.rollback()
        raise

    for student_uuid in query.student_uuids:
        await delete_attendance(
            http_client, request, student_uuid, query.date_earliest, query.course_uuid)

    return Response(status_code=204)
