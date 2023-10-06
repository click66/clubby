import requests

from src.models.attendance import Attendance, Resolution
from ._seeder import seed_attendances
from ._jwt import headers

API_ROOT = 'http://localhost:8000'
API_URL = f'{API_ROOT}/attendance/delete'


def test_delete_single():
    # Given there is a single attendance with a paid resolution
    seed_attendances([Attendance(date='2023-10-15',
                               course_uuid='2580ff60-4e9e-4cc7-8296-df82c91a73e5',
                               member_uuid='a6255bd3-02e9-40b7-a4d6-52cdaab7dbea',
                               resolution=Resolution(paid=True))])

    # When I post to delete any attandance within encompassing dates
    post = {
        'memberUuids': ['a6255bd3-02e9-40b7-a4d6-52cdaab7dbea'],
        'courseUuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'dateEarliest': '2023-10-01',
        'dateLatest': '2023-10-30',
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post returns success
    assert response.status_code is 204

    # And When I query for the attendance I just delete
    response = requests.post(f'{API_ROOT}/attendance/query', json={
        'memberUuids': ['a6255bd3-02e9-40b7-a4d6-52cdaab7dbea'],
        'courseUuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'dateEarliest': '2023-10-15',
        'dateLatest': '2023-10-15',
    }, headers=headers())

    # Then the response is empty
    result = response.json()
    assert len(result) is 0


def test_delete_multiple():
    # Given there are multiple attendances
    seed_attendances([
        Attendance(date='2023-10-15',
                   course_uuid='2580ff60-4e9e-4cc7-8296-df82c91a73e5',
                   member_uuid='a6255bd3-02e9-40b7-a4d6-52cdaab7dbea',
                   ),
        Attendance(date='2023-10-30',
                   course_uuid='2580ff60-4e9e-4cc7-8296-df82c91a73e5',
                   member_uuid='a6255bd3-02e9-40b7-a4d6-52cdaab7dbea',
                   )
    ])

    # When I post to delete any attandance within encompassing dates
    post = {
        'memberUuids': ['a6255bd3-02e9-40b7-a4d6-52cdaab7dbea'],
        'courseUuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'dateEarliest': '2023-10-01',
        'dateLatest': '2023-10-30',
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post returns success
    assert response.status_code is 204

    # And When I query for any attendance within the encompassing dates
    response = requests.post(f'{API_ROOT}/attendance/query', json={
        'memberUuids': ['a6255bd3-02e9-40b7-a4d6-52cdaab7dbea'],
        'courseUuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'dateEarliest': '2023-10-01',
        'dateLatest': '2023-10-30',
    }, headers=headers())

    # Then the response is empty
    result = response.json()
    assert len(result) is 0


def test_delete_some():
    # Given there are multiple attendances
    seed_attendances([
        Attendance(date='2023-10-15',
                   course_uuid='2580ff60-4e9e-4cc7-8296-df82c91a73e5',
                   member_uuid='a6255bd3-02e9-40b7-a4d6-52cdaab7dbea',
                   ),
        Attendance(date='2023-10-30',
                   course_uuid='2580ff60-4e9e-4cc7-8296-df82c91a73e5',
                   member_uuid='a6255bd3-02e9-40b7-a4d6-52cdaab7dbea',
                   ),
        Attendance(date='2023-11-10',
                   course_uuid='2580ff60-4e9e-4cc7-8296-df82c91a73e5',
                   member_uuid='a6255bd3-02e9-40b7-a4d6-52cdaab7dbea',
                   )
    ])

    # When I post to delete any attandance within encompassing dates, excluding one
    post = {
        'memberUuids': ['a6255bd3-02e9-40b7-a4d6-52cdaab7dbea'],
        'courseUuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'dateEarliest': '2023-10-01',
        'dateLatest': '2023-10-30',
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post returns success
    assert response.status_code is 204

    # And When I query for any attendance within the encompassing dates
    response = requests.post(f'{API_ROOT}/attendance/query', json={
        'memberUuids': ['a6255bd3-02e9-40b7-a4d6-52cdaab7dbea'],
        'courseUuid': '2580ff60-4e9e-4cc7-8296-df82c91a73e5',
        'dateEarliest': '2023-10-01',
        'dateLatest': '2023-11-30',
    }, headers=headers())

    # Then the response contains only the one that was not deleted
    result = response.json()
    assert len(result) is 1
