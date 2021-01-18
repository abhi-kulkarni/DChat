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

AWS_S3_CUSTOM_DOMAIN = '%s.s3.amazonaws.com' % AWS_STORAGE_BUCKET_NAME

AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}
AWS_LOCATION = 'static'

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'rolling_matrix/static'),
]
STATIC_URL = 'https://%s/%s/' % (AWS_S3_CUSTOM_DOMAIN, AWS_LOCATION)

AWS_QUERYSTRING_AUTH = False

STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

STATICFILES_STORAGE = 'main.utils.StaticRootS3BotoStorage'

DEFAULT_FILE_STORAGE = 'main.utils.MediaRootS3BotoStorage'

try:
    from main.settings.local import *
except:
    pass
