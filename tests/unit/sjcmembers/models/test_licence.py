import pytest

from datetime import datetime, timedelta

from sjcadmin.sjcmembers.models.licence import Licence


def test_create_read_licence():
    name = 'John Smith'
    tjjf_no = 54321
    expiry = datetime.now()
    sut = Licence(name, tjjf_no, expiry)

    assert sut.name is name
    assert sut.tjjf_no is tjjf_no
    assert sut.expiry is expiry


def test_valid_licence_validity():
    expiry = datetime.now() + timedelta(days=7)

    sut = Licence('Not expired', 12345, expiry)

    assert sut.get_validity(datetime.now()) is 'valid'


def test_expired_licence_validity():
    expiry = datetime.now() - timedelta(days=7)

    sut = Licence('Expired', 98765, expiry)

    assert sut.get_validity(datetime.now()) is 'expired'
