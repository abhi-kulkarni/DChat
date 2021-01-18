from main.settings.base import *
from decouple import config
from storages.backends.s3boto3 import S3Boto3Storage

ALLOWED_HOSTS = ['3.7.46.49', 'rollingmatrix.com']

CSRF_COOKIE_SECURE = True

SESSION_COOKIE_SECURE = True

SECURE_SSL_REDIRECT = True

SECURE_SSL_HOST = config('SECURE_SSL_HOST')

SECURE_HSTS_SECONDS = 31536000

# STATIC_URL = '/home/ubuntu/'

AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')

AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')

AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')

AWS_S3_FILE_OVERWRITE = False

AWS_DEFAULT_ACL = None

STATICFILES_STORAGE = 'main.utils.StaticRootS3BotoStorage'

DEFAULT_FILE_STORAGE = 'main.utils.MediaRootS3BotoStorage'

try:
    from main.settings.local import *
except:
    pass
