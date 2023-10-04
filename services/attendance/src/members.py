import aiohttp
import asyncio

from datetime import date
from uuid import UUID

from src.errors import DomainError
from src.models.attendance import Attendance


class Membership:
    member_uuid: UUID
    licence_no: int | None


class HttpClient:
    session: aiohttp.ClientSession = None

    def start(self, base_url):
        self.session = aiohttp.ClientSession(
            base_url=base_url)

    async def stop(self):
        await self.session.close()
        self.session = None

    def __call__(self) -> aiohttp.ClientSession:
        assert self.session is not None
        return self.session


async def attempt_attendance(client: HttpClient, request, attendance: Attendance, use_advanced_payment: bool):
    async with client.post('/api/attendance/log', json={
        'student_uuid': str(attendance.student_uuid),
        'sess_date': attendance.date.isoformat(),
        'product': str(attendance.course_uuid),
        'payment': attendance.resolution_type,
        'payment_option': 'now' if not use_advanced_payment else 'advanced',
    }, headers={'Authorization': request.headers.get('Authorization')}) as resp:
        default_error = 'Member attendance request was rejected'
        try:
            response = await resp.json()

            if resp.status != 200 or 'error' in response:
                error = response.get('error', default_error)
                raise DomainError(error)

        except:
            raise DomainError(default_error)


async def delete_attendance(client: HttpClient, request, student_uuid: UUID, date: date, course_uuid: UUID):
    await client.post('/api/attendance/clear', json={
        'student_uuid': str(student_uuid),
        'sess_date': date.isoformat(),
        'product': str(course_uuid),
    }, headers={'Authorization': request.headers.get('Authorization')})


async def get_manageable_members(client: HttpClient, request, user_uuid: UUID):
    async with client.post('/api/members/query', json={
        'user_uuid': str(user_uuid),
    }, headers={'Authorization': request.headers.get('Authorization')}) as resp:
        response = await resp.json()
        if resp.status is not 200 or 'error' in response:
            return []
        return response
