from main.settings.base import *
from decouple import config

ALLOWED_HOSTS = ['3.7.46.49', 'rollingmatrix.com']

CSRF_COOKIE_SECURE = True

SESSION_COOKIE_SECURE = True

SECURE_SSL_REDIRECT = True

SECURE_SSL_HOST = 'https://rollingmatrix.com'

SECURE_HSTS_SECONDS = 31536000

STATIC_URL = '/home/ubuntu/'

try:
    from main.settings.local import *
except:
    pass
