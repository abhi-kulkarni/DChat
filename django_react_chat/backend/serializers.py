from rest_framework import serializers
from .models import User
from rest_framework.response import Response

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__' 
        extra_kwargs = {'password': {'write_only': True}}

    