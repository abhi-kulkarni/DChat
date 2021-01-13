from main.settings.base import *
from decouple import config

# Override base.py settings here

ALLOWED_HOSTS = ['3.7.46.49']

CSRF_COOKIE_NAME = "csrftoken"

STATIC_URL = '/home/ubuntu/'

try:
    from main.settings.local import *
except:
    pass
