import pytest
import requests

from ._seeder import delete_user, delete_course, delete_member, read_member_payments, seed_course, seed_attendances, seed_member, seed_member_payment, seed_member_subscription, seed_user
from ._jwt import headers

API_ROOT = 'http://localhost:8000'
API_URL = f'{API_ROOT}/attendance/create'


@pytest.fixture
def setup_course_and_member():
    course_uuid = seed_course({
        'label': 'My course',
        'days': [0],
    })

    member_uuid = seed_member({
        'name': 'John Doe',
        'course': {'uuid': str(course_uuid)},
        'email': 'johndoe@example.com',
    })

    yield (course_uuid, member_uuid)

    delete_course(course_uuid)
    delete_member(member_uuid)


@pytest.fixture
def setup_user():
    user_uuid = seed_user('johndoe@example.com')
    yield user_uuid
    delete_user(user_uuid)


def test_no_resolution(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member

    # When I post a new attendance
    post = {
        'memberUuid': str(member_uuid),
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
        'member_uuids': [str(member_uuid)],
        'courseUuid': str(course_uuid),
        'dateEarliest': '2023-10-15',
        'dateLatest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()


def test_paid(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member

    # When I post a new attendance with a resolution of "paid"
    post = {
        'memberUuid': str(member_uuid),
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
        'member_uuids': [str(member_uuid)],
        'courseUuid': str(course_uuid),
        'dateEarliest': '2023-10-15',
        'dateLatest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()


def test_paid_in_advance_no_advance_payment(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member

    # When I post a new attendance with a resolution of "paid"
    post = {
        'memberUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
        'resolution': 'paid',
        'useAdvancedPayment': True,
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post is rejected with an appropriate error
    assert response.status_code == 422
    assert response.json().get('detail') == 'Usable payment method was not found on account'


def test_paid_in_advance(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member

    # And that member has one payment for the relevant course
    seed_member_payment(member_uuid, course_uuid)

    # When I post a new attendance with a resolution of "paid"
    post = {
        'memberUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
        'resolution': 'paid',
        'useAdvancedPayment': True,
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post is successful
    assert response.status_code == 200


def test_paid_with_subscription(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member

    # And that member has a subscription for the relevant course
    seed_member_subscription(member_uuid, course_uuid, expiry_date='2023-11-15')

    # When I post a new attendance with a resolution of "paid", and an instruction to use a subscription
    post = {
        'memberUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
        'resolution': 'paid',
        'useAdvancedPayment': False,
        'useSubscription': True,
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post is successful
    assert response.status_code == 200

    # And no new payments have been taken
    payments = read_member_payments(member_uuid)
    assert len(payments) == 0


def test_paid_with_subscription_no_subscription(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member

    # When I post a new attendance with a resolution of "paid", and an instruction to use a subscription
    post = {
        'memberUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
        'resolution': 'paid',
        'useAdvancedPayment': False,
        'useSubscription': True,
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post is rejected with an appropriate error
    assert response.status_code == 422
    assert response.json().get('detail') == 'Usable payment method was not found on account'


def test_paid_with_subscription_expired_subscription(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member

    # And that member has a subscription for the relevant course, but it is expired
    seed_member_subscription(member_uuid, course_uuid, expiry_date='2023-09-15')

    # When I post a new attendance with a resolution of "paid", and an instruction to use a subscription
    post = {
        'memberUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
        'resolution': 'paid',
        'useAdvancedPayment': False,
        'useSubscription': True,
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post is rejected with an appropriate error
    assert response.status_code == 422
    assert response.json().get('detail') == 'Usable payment method was not found on account'


def test_has_subscription_pay_with_advanced_payment(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member
    
    # And that member has a valid subscription for the relevant course
    seed_member_subscription(member_uuid, course_uuid, expiry_date='2023-11-15')

    # And that member has one advanced payment for the relevant course
    seed_member_payment(member_uuid, course_uuid)
    
    # When I post a new attendance with a resolution of "paid", and an instruction to use a subscription
    post = {
        'memberUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
        'resolution': 'paid',
        'useAdvancedPayment': True,
        'useSubscription': False,
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post is successful
    assert response.status_code == 200

    # And the payment has been taken
    payments = read_member_payments(member_uuid)
    assert payments[0].get('used') is True


def test_has_advanced_payment_pay_with_subscription(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member
    
    # And that member has a valid subscription for the relevant course
    seed_member_subscription(member_uuid, course_uuid, expiry_date='2023-11-15')

    # And that member has one advanced payment for the relevant course
    seed_member_payment(member_uuid, course_uuid)
    
    # When I post a new attendance with a resolution of "paid", and an instruction to use a subscription
    post = {
        'memberUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
        'resolution': 'paid',
        'useAdvancedPayment': False,
        'useSubscription': True,
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post is successful
    assert response.status_code == 200

    # And no new payments have been taken
    payments = read_member_payments(member_uuid)
    assert payments[0].get('used') is False


def test_has_subscription_pay_now(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member
    
    # And that member has a valid subscription for the relevant course
    seed_member_subscription(member_uuid, course_uuid, expiry_date='2023-11-15')
    
    # When I post a new attendance with a resolution of "paid", and an instruction to use a subscription
    post = {
        'memberUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
        'resolution': 'paid',
        'useAdvancedPayment': False,
        'useSubscription': False,
    }
    response = requests.post(API_URL, json=post, headers=headers())

    # Then the post is successful
    assert response.status_code == 200

    # And a new payment has been taken
    payments = read_member_payments(member_uuid)
    assert len(payments) is 1
    assert payments[0].get('used') is True
    

def test_comp(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member

    # When I post a new attendance with a resolution of "comp"
    post = {
        'memberUuid': str(member_uuid),
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
        'member_uuids': [str(member_uuid)],
        'courseUuid': str(course_uuid),
        'dateEarliest': '2023-10-15',
        'dateLatest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()


def test_create_attendance_ineligible_member(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member

    # When I post three attendances
    i = 1
    responses = []
    while i <= 3:
        responses.append(requests.post(API_URL, json={
            'memberUuid': str(member_uuid),
            'courseUuid': str(course_uuid),
            'date': '2023-10-0' + str(i),
        }, headers=headers()))
        i += 1

    # Then I receive an error response on the last
    result = responses[2].json()
    assert responses[2].status_code == 422
    assert result.get(
        'detail') == 'Unlicenced member has no remaining trial sessions'


def test_non_staff_user_creates_own_attendance(setup_course_and_member):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member

    # When I post a new attendance
    post = {
        'memberUuid': str(member_uuid),
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
        'member_uuids': [str(member_uuid)],
        'courseUuid': str(course_uuid),
        'dateEarliest': '2023-10-15',
        'dateLatest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()


def test_member_create_new_attendance_no_resolution(setup_course_and_member, setup_user):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is one member who has 2 trial sessions (2 sessions is currently default implementation)
    course_uuid, member_uuid = setup_course_and_member

    # And the member has an account
    user_uuid = setup_user

    # When I post a new attendance AS A MEMBER
    post = {
        'memberUuid': str(member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
    }
    response = requests.post(
        API_URL, json=post, headers=headers({'userUuid': str(user_uuid)}, admin=False))

    # Then the post returns success
    assert response.status_code == 200

    # And contains the attenance I just created
    assert post.items() <= response.json().items()

    # And When I query for the attendance I just created
    response = requests.post(f'{API_ROOT}/attendance/query', json={
        'member_uuids': [str(member_uuid)],
        'courseUuid': str(course_uuid),
        'dateEarliest': '2023-10-15',
        'dateLatest': '2023-10-15',
    }, headers=headers())

    # Then that same attendance is included in the response
    result = response.json()
    assert len(result) > 0
    assert post.items() <= result[0].items()


def test_member_different_user_fails(setup_course_and_member, setup_user):
    # Given there are no pre-existing attendances
    seed_attendances([])

    # And there is a single course
    # And there is a member in that course
    course_uuid, _ = setup_course_and_member

    # And the member has an account
    user_uuid = setup_user

    # And there is another member in the same course
    second_member_uuid = seed_member({
        'name': 'Someone else',
        'course': {'uuid': str(course_uuid)},
        'email': 'someoneelse@example.com',
    })

    # When I, as the first member, try and log attendance for the second member
    post = {
        'memberUuid': str(second_member_uuid),
        'courseUuid': str(course_uuid),
        'date': '2023-10-15',
    }
    response = requests.post(API_URL, json=post, headers=headers(
        {'userUuid': str(user_uuid)}, admin=False))

    # Then the post should return a 403 Forbidden
    assert response.status_code == 403
