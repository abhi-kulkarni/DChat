from rest_framework import serializers
from .models import User, Notification, Room, Chat
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate, login, logout
from friendship.models import Friend, FriendshipRequest

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__' 
        extra_kwargs = {'password': {'write_only': True}}


class FriendRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendshipRequest
        fields = ('from_user', 'to_user', 'created', 'rejected', 'viewed', 'message')


class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = Friend
        fields = '__all__'

class ChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chat
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        from .socket_views import manage_friend_request_data, manage_chat_request_data, get_all_notifications

        post_data = dict(attrs)
        user = authenticate(self.context['request'], username=post_data['email'], password=post_data['password'])
        data = dict()
        if user:
            data = super().validate(attrs)
            refresh = self.get_token(self.user)
            data['refresh'] = str(refresh)
            data['access'] = str(refresh.access_token)
            data['user'] = UserSerializer(self.user).data
            data['user']['friend_requests'] = manage_friend_request_data([self.user.id], '', None)[self.user.id]
            data['user']['chat_requests'] = manage_chat_request_data([self.user.id], '', '', None)[self.user.id]
            data['user']['notifications'] = get_all_notifications(self.user.id)
            data['ok'] = True
        else:
            data['ok'] = False
            data['error'] = 'Invalid Credentials.'
        return data