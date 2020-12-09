from rest_framework import serializers
from .models import User
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate, login, logout

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__' 
        extra_kwargs = {'password': {'write_only': True}}


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):

        post_data = dict(attrs)
        user = authenticate(self.context['request'], username=post_data['email'], password=post_data['password'])
        data = dict()
        if user:
            data = super().validate(attrs)
            refresh = self.get_token(self.user)
            data['refresh'] = str(refresh)
            data['access'] = str(refresh.access_token)
            data['user'] = UserSerializer(self.user).data
            data['ok'] = True
        else:
            data['ok'] = False
            data['error'] = 'Invalid Credentials.'
        return data