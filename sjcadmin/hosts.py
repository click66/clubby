from django_hosts import patterns, host
from django.conf import settings

host_patterns = patterns('',
                         host(r'admin', 'sjcadmin.sjcadmin.urls', name='admin'),
                         host(r'members', 'sjcadmin.sjcmembers.urls',
                              name='members'),
                         )
