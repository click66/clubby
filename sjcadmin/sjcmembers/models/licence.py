from datetime import date


class Licence:
    def __init__(self, name, tjjf_no, expiry: date):
        self._name = name
        self._tjjf_no = tjjf_no
        self._expiry = expiry

    @property
    def name(self):
        return self._name

    @property
    def tjjf_no(self):
        return self._tjjf_no

    @property
    def expiry(self):
        return self._expiry
    
    def get_validity(self, current_date):
        if self._expiry < current_date:
            return 'expired'

        return 'valid'
