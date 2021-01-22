from main.settings.base import *
from decouple import config

ALLOWED_HOSTS = ['3.7.46.49', 'rollingmatrix.com']

CSRF_COOKIE_SECURE = True

SESSION_COOKIE_SECURE = True

SECURE_SSL_REDIRECT = True

SECURE_SSL_HOST = config('SECURE_SSL_HOST')

SECURE_HSTS_SECONDS = 31536000

STATIC_URL = '/home/ubuntu/'

MEDIA_URL = '/home/ubuntu/media'

try:
    from main.settings.local import *
except:
    pass
