from main.settings.base import *
from decouple import config

ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

CORS_ORIGIN_WHITELIST = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
]

STATIC_URL = '/static/'

MEDIA_URL = '/media/'

try:
    from main.settings.local import *
except:
    pass