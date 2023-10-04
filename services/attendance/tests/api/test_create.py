import requests

from ._seeder import seed_course, seed_attendances, seed_member
from ._jwt import headers

API_ROOT = 'http://localhost:8000'
API_URL = f'{API_ROOT}/attendance/create'


def seed_course_and_member():
    course_uuid = seed_course({
        'courseName': 'My course',
        'courseDay': [0],
    })

    member_uuid = seed_member({
        'studentName': 'John Doe',
        'product': str(course_uuid),
    })

    return (course_uuid, member_uuid)


def test_create_new_attendance_no_resolution():
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    (course_uuid, member_uuid) = seed_course_and_member()

    # When I post a new attendance
    post = {
        'studentUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post returns success
    assert response.status_code == 200

    # And contains the attenance I just created
    assert post.items() <= response.json().items()

    # And When I query for the attendance I just created
    response = requests.post(f'{API_ROOT}/attendance/query', json={
        'student_uuids': [str(member_uuid)],
        'courseUuid': str(course_uuid),
        'dateEarliest': '2023-10-15',
        'dateLatest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()


def test_create_new_attendance_paid():
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    (course_uuid, member_uuid) = seed_course_and_member()

    # When I post a new attendance with a resolution of "paid"
    post = {
        'studentUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
        'resolution': 'paid',
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post returns success
    assert response.status_code == 200

    # And contains the attenance I just created
    assert post.items() <= response.json().items()

    # And When I query for the attendance I just created
    response = requests.post(f'{API_ROOT}/attendance/query', json={
        'student_uuids': [str(member_uuid)],
        'courseUuid': str(course_uuid),
        'dateEarliest': '2023-10-15',
        'dateLatest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()


def test_create_new_attendance_comp():
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    (course_uuid, member_uuid) = seed_course_and_member()

    # When I post a new attendance with a resolution of "comp"
    post = {
        'studentUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
        'resolution': 'comp',
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post returns success
    assert response.status_code == 200

    # And contains the attenance I just created
    assert post.items() <= response.json().items()

    # And When I query for the attendance I just created
    response = requests.post(f'{API_ROOT}/attendance/query', json={
        'student_uuids': [str(member_uuid)],
        'courseUuid': str(course_uuid),
        'dateEarliest': '2023-10-15',
        'dateLatest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()


def test_create_attendance_ineligible_member():
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    (course_uuid, member_uuid) = seed_course_and_member()

    # When I post three attendances
    i = 1
    responses = []
    while i <= 3:
        responses.append(requests.post(API_URL, json={
            'studentUuid': str(member_uuid),
            'courseUuid': str(course_uuid),
            'date': '2023-10-0' + str(i),
        }, headers=headers()))
        i += 1

    # Then I receive an error response on the last
    result = responses[2].json()
    assert responses[2].status_code == 422
    assert result.get(
        'detail') == 'Unlicenced student has no remaining trial sessions'


def test_non_staff_user_creates_own_attendance():
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    (course_uuid, member_uuid) = seed_course_and_member()

    # When I post a new attendance
    post = {
        'studentUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post returns success
    assert response.status_code == 200

    # And contains the attenance I just created
    assert post.items() <= response.json().items()

    # And When I query for the attendance I just created
    response = requests.post(f'{API_ROOT}/attendance/query', json={
        'student_uuids': [str(member_uuid)],
        'courseUuid': str(course_uuid),
        'dateEarliest': '2023-10-15',
        'dateLatest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()
