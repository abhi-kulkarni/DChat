from django.urls import re_path
from django.conf.urls import url

from . import consumers

websocket_urlpatterns = [
    url(r'^ws/chat/(?P<room_name>[^/]+)/$', consumers.Consumer.as_asgi()),
    url(r'^ws/(?P<room_name>\w+)/$', consumers.Consumer.as_asgi())
]