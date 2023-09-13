import requests

from ._seeder import seed_database
from ._jwt import headers

API_ROOT = 'http://localhost:8000'
API_URL = f'{API_ROOT}/attendance/create'


def test_create_new_attendance_no_resolution():
    # Given there are no pre-existing attendances
    seed_database([])

    # When I post a new attendance
    post = {
        'student_uuid': '9feeb8d1-20f3-4f90-ac7b-ece13a34b6d4',
        'course_uuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'date': '2023-10-15',
    }
    response = requests.post(API_URL, json=post, headers=headers())
    print(headers())
    # Then the post returns success
    assert response.status_code is 200

    # And contains the attenance I just created
    assert post.items() <= response.json().items()

    # And When I query for the attendance I just created
    response = requests.post(f'{API_ROOT}/attendance/query', json={
        'student_uuids': ['9feeb8d1-20f3-4f90-ac7b-ece13a34b6d4'],
        'course_uuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'date_earliest': '2023-10-15',
        'date_latest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()


def test_create_new_attendance_paid():
    # Given there are no pre-existing attendances
    seed_database([])

    # When I post a new attendance with a resolution of "paid"
    post = {
        'student_uuid': '9feeb8d1-20f3-4f90-ac7b-ece13a34b6d4',
        'course_uuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'date': '2023-10-15',
        'resolution': 'paid',
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post returns success
    assert response.status_code is 200

    # And contains the attenance I just created
    assert post.items() <= response.json().items()

    # And When I query for the attendance I just created
    response = requests.post(f'{API_ROOT}/attendance/query', json={
        'student_uuids': ['9feeb8d1-20f3-4f90-ac7b-ece13a34b6d4'],
        'course_uuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'date_earliest': '2023-10-15',
        'date_latest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()


def test_create_new_attendance_comp():
    # Given there are no pre-existing attendances
    seed_database([])

    # When I post a new attendance with a resolution of "comp"
    post = {
        'student_uuid': '9feeb8d1-20f3-4f90-ac7b-ece13a34b6d4',
        'course_uuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'date': '2023-10-15',
        'resolution': 'comp',
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post returns success
    assert response.status_code is 200

    # And contains the attenance I just created
    assert post.items() <= response.json().items()

    # And When I query for the attendance I just created
    response = requests.post(f'{API_ROOT}/attendance/query', json={
        'student_uuids': ['9feeb8d1-20f3-4f90-ac7b-ece13a34b6d4'],
        'course_uuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'date_earliest': '2023-10-15',
        'date_latest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()
