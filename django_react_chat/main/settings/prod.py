from main.settings.base import *

# Override base.py settings here

ALLOWED_HOSTS = ['3.7.46.49']

try:
    from main.settings.local import *
except:
    pass
