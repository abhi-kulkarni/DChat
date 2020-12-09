from django.db import models
import uuid
from django.contrib.auth.models import AbstractUser
import datetime

class User(AbstractUser):

    created_on = models.DateTimeField(null=datetime.datetime.now())
    updated_on = models.DateTimeField(null=datetime.datetime.now())
    last_passwords = models.TextField(null=True)
    expiry_token = models.CharField(max_length=50, null=True, default=None)
    expiry_date = models.DateTimeField(null=True)
    sso = models.BooleanField(null=True)
    locked = models.BooleanField(null=True)
    provider = models.CharField(max_length=20, null=True)
    last_login = models.DateTimeField(null=True)
    profile_picture = models.TextField(null=True)
    extra_data = models.TextField(null=True)
    gender = models.CharField(null=True, max_length=20)
    country = models.CharField(null=True, max_length=50)
    email = models.EmailField(blank=True, unique=True)

    EMAIL_FIELD = 'email'
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
