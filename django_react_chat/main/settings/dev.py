from main.settings.base import *
from decouple import config

ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

CORS_ORIGIN_WHITELIST = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'frontend/src/build')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

STATIC_URL = '/static/'

STATIC_ROOT = os.path.join(BASE_DIR, 'static')

MEDIA_URL = '/media/'

MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

STATICFILES_DIRS = [
   os.path.join(BASE_DIR, "frontend/src/build/static"),
]

try:
    from main.settings.local import *
except:
    pass