
from main.settings.base import *
from decouple import config

# Override base.py settings here
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

try:
    from main.settings.local import *
except:
    pass