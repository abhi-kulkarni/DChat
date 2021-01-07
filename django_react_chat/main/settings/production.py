from main.settings.base import *

# Override base.py settings here

DEBUG = False

ALLOWED_HOSTS = ['3.7.46.49']

DATABASES = {
    'default': {
        'ENGINE': os.environ.get('DB_ENGINE', config('DB_ENGINE')),
        'NAME': os.environ.get('DB_NAME', config('DB_NAME')),
        'USER': os.environ.get('DB_USER', config('DB_USER')),
        'PASSWORD':os.environ.get('DB_PASSWORD', config('DB_PASSWORD')),
        'HOST': os.environ.get('DB_HOST', config('DB_HOST')),
        'PORT': os.environ.get('DB_HOST', config('DB_HOST')),
        'OPTIONS': {
            'charset': 'utf8mb4'
        },
        'TEST': {
            'NAME': os.environ.get('TEST_DB_NAME', config('TEST_DB_NAME'))
        }
    }
}

try:
    from main.settings.local import *
except:
    pass