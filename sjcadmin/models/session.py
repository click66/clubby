from datetime import date, timedelta


class Session:
    def __init__(self, sess_date, course):
        self._sess_date = sess_date
        self._course = course

    @property
    def course_uuid(self):
        return self._course.uuid

    @classmethod
    def make(cls, sess_date: date, course):
        return Session(sess_date, course)

    @classmethod
    def gen(cls, start: date, end: date, courses: list=None, exclusive=False):
        if courses is None:
            courses = []

        def daterange(start_date, end_date):
            end_date += timedelta(days=1)
            for n in range(int((end_date - start_date).days)):
                yield start_date + timedelta(n)

        out = []

        if exclusive:
            for d in daterange(start, end):
                if any(map(lambda c: c.is_session_date(d), courses)):
                    out.append(cls.make(sess_date=d, course=courses[1]))
            return out

        for d in daterange(start, end):
            for course in courses:
                if course.is_session_date(d):
                    out.append(cls.make(sess_date=d, course=course))
        return out

    @classmethod
    def gen_next(cls, start: date, course):
        while not course.is_session_date(start):
            start += timedelta(days=1)
        return cls.make(sess_date=start, course=course)

    @property
    def date(self):
        return self._sess_date
