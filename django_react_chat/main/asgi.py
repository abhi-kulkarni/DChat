"""
ASGI config for i-saw-aliens project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/howto/deployment/asgi/
"""
import django
import os
from decouple import config
from channels.routing import get_default_application

if config('ENV') == 'dev':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings.dev')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings.prod')

django.setup()

application = get_default_application()
