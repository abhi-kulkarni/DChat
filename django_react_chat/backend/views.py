from django.shortcuts import render,HttpResponse
from .serializers import UserSerializer
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
import json
from django.db import IntegrityError

@api_view(["POST"])
def login_view(request):
    print("LOGIN CALLED")
    return HttpResponse("LOGIN CALLED")

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
def delete_user(request, pk):
    
    User.objects.filter(pk=pk).delete()
    return Response({'ok': True}, status=status.HTTP_200_OK)

@api_view(["GET"])
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