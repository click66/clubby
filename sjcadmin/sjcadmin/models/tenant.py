from django.db import models
from uuid import uuid4


class Tenant(models.Model):
    uuid = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name = models.CharField(null=True, max_length=50)
