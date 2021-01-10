from main.settings.base import *
from decouple import config

# Override base.py settings here

ALLOWED_HOSTS = ['3.7.46.49']

STATIC_URL = '/home/ubuntu/static/'

try:
    from main.settings.local import *
except:
    pass
