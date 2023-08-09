from datetime import date
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from ..models.session import Session
from ..models.course import Course


@login_required(login_url='/auth/login')
def courses(request):
    def render_days(nums):
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        return [days[num] for num in nums]

    return render(request, 'sjcadmin/courses.html', {
        'courses': map(lambda c: {
            'uuid': c.uuid,
            'label': c.label,
            'days': render_days(c.days),
            "next_session_date": Session.gen_next(date.today(), c).date,
        }, Course.objects.all()),
    })
