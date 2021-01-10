"""
ASGI config for i-saw-aliens project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/howto/deployment/asgi/
"""

import os
from decouple import config
from django.core.asgi import get_asgi_application

if os.environ.get('ENV', config('ENV')) == 'dev':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings.dev')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings.prod')

application = get_asgi_application()
