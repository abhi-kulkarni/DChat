from django.shortcuts import render,HttpResponse
from .serializers import UserSerializer
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
import json
from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import permissions
from .serializers import MyTokenObtainPairSerializer
from django.contrib.auth.hashers import check_password, make_password


class ObtainTokenPairWithEmailView(TokenObtainPairView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = MyTokenObtainPairSerializer


@api_view(["POST"])
def signin(request):
    email = request.data['email']
    password = request.data['password']
    user = authenticate(request, username=email, password=password)
    serializer = UserSerializer(user)
    if user:
        login(request, user)
        return Response({'ok': True, 'user': serializer.data})
    else:
        return Response({'ok': False, 'error': 'Some of your fields are incorrect'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def is_authenticated(request):
    if request.user:
        serializer = UserSerializer(request.user)
        return Response({'ok': True, 'user': serializer.data, 'is_logged_in': True})
    else:
        return Response({'ok': False})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_curr_user(request):
    serializer = UserSerializer(request.user)
    return Response({'ok': True, 'user': serializer.data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def signout(request):
    logout(request)
    return Response({'ok': True})


@api_view(["POST"])
def signup(request):
    error_msg = 'Some error occured.'
    try:
        user = User.objects.create(**request.data)
        user.set_password(request.data['password'])
        user.save()
    except IntegrityError as e:
        err = e.args[1].split(" ")
        err_col = err[len(err)-1].replace("'", "").split(".")[1]
        if e.args[0] == 1062:
            error_msg = 'This ' +  err_col + ' already exists. Please use another one.'
        return Response({'ok': False, 'error': error_msg})
    serializer = UserSerializer(user)
    return Response({'ok': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_user(request, pk):
    curr_user = User.objects.filter(pk=pk)
    error_msg = 'Some error occured.'
    try:
        curr_user.update(**request.data)
    except IntegrityError as e:
        err = e.args[1].split(" ")
        err_col = err[len(err)-1].replace("'", "").split(".")[1]
        if e.args[0] == 1062:
            error_msg = 'This ' +  err_col + ' already exists. Please use another one.'
        return Response({'ok': False, 'error': error_msg})
    user_obj = User.objects.get(pk=pk)
    serializer = UserSerializer(user_obj)
    return Response({'ok': True, 'data': serializer.data}, status=status.HTTP_200_OK)
    

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_user(request, pk):
    
    User.objects.filter(pk=pk).delete()
    return Response({'ok': True}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    
    all_users = User.objects.all()
    if all_users:
        serializer = UserSerializer(all_users, many=True)
        return Response({"ok": True, "users": serializer.data}, status=status.HTTP_200_OK)
    else:
        return Response({"ok": False, "users": [], "error": "Some error occured."})


@api_view(['POST'])
def validate_email(request):

    post_data = request.data
    try:
        user_data = User.objects.get(email=post_data['email'])
        return Response({'ok': True})
    except User.DoesNotExist:
        return Response({'ok': False})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_password(request):

    post_data = request.data
    user_data = User.objects.get(email=request.user.email)
    if check_password(post_data['password'], user_data.password):
        return Response({'ok': True})
    else:
        return Response({'ok': False})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):

    post_data = request.data
    user_data = User.objects.get(email=request.user.email)
    if user_data:
        user_data.set_password(post_data['password'])
        user_data.save()
        return Response({'ok': True})
    else:
        return Response({'ok': False})