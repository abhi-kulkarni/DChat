from main.settings.base import *
from decouple import config

# Override base.py settings here

ALLOWED_HOSTS = ['3.7.46.49']

STATIC_URL = '/home/ubuntu/'

CSRF_COOKIE_NAME = "csrftoken"

try:
    from main.settings.local import *
except:
    pass
