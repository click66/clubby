import pytest

from src.errors import InvalidResolutionError
from src.models.attendance import Resolution


def test_resolution_type_paid():
    # Given I have an Attendance with paid resolution
    sut = Resolution(paid=True)

    # When I request the type of the attendance
    result = sut.type

    # Then the type will be paid
    assert result is 'paid'


def test_resolution_type_complementary():
    # Given I have an Attendance with complementary resolution
    sut = Resolution(complementary=True)

    # When I request the type of the attendance
    result = sut.type

    # Then the type will be comp
    assert result is 'comp'


def test_resolution_cannot_be_both_paid_and_complementary():
    with pytest.raises(InvalidResolutionError):
        # When I create a Resolution that is both paid and complementary
        Resolution(paid=True, complementary=True)
