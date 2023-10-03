import requests

from src.models.attendance import Attendance, Resolution
from ._seeder import seed_attendances
from ._jwt import headers

API_ROOT = 'http://localhost:8000'
API_URL = f'{API_ROOT}/attendance/query'


def test_empty_query():
    # Given the database contains no data
    seed_attendances([])

    # When I query for all attendances in a given timespan
    response = requests.post(API_URL, json={
        'studentUuids': ['17f935dd-c1ef-4672-a666-0fccbbdeffa9'],
        'courseUuid': 'd96ca318-f35e-475e-8015-4418cc13b343',
        'date_earliest': '2022-10-10',
        'date_latest': '2024-10-10',
    }, headers=headers())

    # Then the query returns success
    assert response.status_code is 200

    # And the response contains an empty array
    assert response.json() == []


def test_expected_attendance_schema_complementary():
    # Given the database contains a single complementary attendance
    seed_attendances([Attendance(student_uuid='17f935dd-c1ef-4672-a666-0fccbbdeffa9',
                               course_uuid='d96ca318-f35e-475e-8015-4418cc13b343',
                               date='2023-10-15',
                               resolution=Resolution(complementary=True))])

    # When I query for all attendances in a given timespan
    response = requests.post(API_URL, json={
        'studentUuids': ['17f935dd-c1ef-4672-a666-0fccbbdeffa9'],
        'courseUuid': 'd96ca318-f35e-475e-8015-4418cc13b343',
        'date_earliest': '2022-10-10',
        'date_latest': '2024-10-10',
    }, headers=headers())

    # Then the query returns success
    assert response.status_code is 200

    # And the response contains a single attendance with resolution value "comp"
    result = response.json()
    assert len(result) > 0
    assert {
        'studentUuid': '17f935dd-c1ef-4672-a666-0fccbbdeffa9',
        'courseUuid': 'd96ca318-f35e-475e-8015-4418cc13b343',
        'date': '2023-10-15',
        'resolution': 'comp',
    }.items() <= result[0].items()


def test_expected_attendance_schema_paid():
    # Given the database contains a single complementary attendance
    seed_attendances([Attendance(student_uuid='17f935dd-c1ef-4672-a666-0fccbbdeffa9',
                               course_uuid='d96ca318-f35e-475e-8015-4418cc13b343',
                               date='2023-10-15',
                               resolution=Resolution(paid=True))])

    # When I query for all attendances in a given timespan
    response = requests.post(API_URL, json={
        'studentUuids': ['17f935dd-c1ef-4672-a666-0fccbbdeffa9'],
        'courseUuid': 'd96ca318-f35e-475e-8015-4418cc13b343',
        'date_earliest': '2022-10-10',
        'date_latest': '2024-10-10',
    }, headers=headers())

    # Then the query returns success
    assert response.status_code is 200

    # And the response contains a single attendance with resolution value "paid"
    result = response.json()
    assert len(result) > 0
    assert {
        'studentUuid': '17f935dd-c1ef-4672-a666-0fccbbdeffa9',
        'courseUuid': 'd96ca318-f35e-475e-8015-4418cc13b343',
        'date': '2023-10-15',
        'resolution': 'paid',
    }.items() <= result[0].items()


def test_no_resolution():
    # Given the database contains a single complementary attendance
    seed_attendances([Attendance(student_uuid='17f935dd-c1ef-4672-a666-0fccbbdeffa9',
                               course_uuid='d96ca318-f35e-475e-8015-4418cc13b343',
                               date='2023-10-15')])

    # When I query for all attendances in a given timespan
    response = requests.post(API_URL, json={
        'studentUuids': ['17f935dd-c1ef-4672-a666-0fccbbdeffa9'],
        'courseUuid': 'd96ca318-f35e-475e-8015-4418cc13b343',
        'date_earliest': '2022-10-10',
        'date_latest': '2024-10-10',
    }, headers=headers())

    # Then the query returns success
    assert response.status_code is 200

    # And the response contains a single attendance with resolution value None
    result = response.json()
    assert len(result) > 0
    assert {
        'studentUuid': '17f935dd-c1ef-4672-a666-0fccbbdeffa9',
        'courseUuid': 'd96ca318-f35e-475e-8015-4418cc13b343',
        'date': '2023-10-15',
        'resolution': None,
    }.items() <= result[0].items()
