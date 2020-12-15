from django.shortcuts import render,HttpResponse
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
from .serializers import MyTokenObtainPairSerializer, FriendSerializer, FriendRequestSerializer, UserSerializer
from django.contrib.auth.hashers import check_password, make_password
from friendship.models import Friend, Follow, Block, FriendshipRequest 
from django.core.cache import cache

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
    from .socket_views import manage_friend_request_data

    if request.user:
        serializer = UserSerializer(request.user)
        friend_requests = manage_friend_request_data([request.user.id], '')[request.user.id]
        return Response({'ok': True, 'user': serializer.data, 'is_logged_in': True, 'friend_requests': friend_requests})
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manage_friends(request):

    post_data = request.data
    recipient_user_id = post_data['recipient_user_id']
    recipient_user = User.objects.get(pk=recipient_user_id)
    try:
        if post_data['action'] == 'add':
            Friend.objects.add_friend(request.user, recipient_user, message='Hi! I would like to be friends with you')      
        elif post_data['action'] == 'remove':
            Friend.objects.remove_friend(request.user, recipient_user)
        elif post_data['action'] == 'accept':
            friend_request = FriendshipRequest.objects.get(to_user=request.user.id)
            friend_request.accept()
        elif post_data['action'] == 'reject':
            friend_request = FriendshipRequest.objects.get(to_user=request.user.id)
            friend_request.reject()
            friend_request.delete()
        elif post_data['action'] == 'cancel':  
            FriendshipRequest.objects.filter(to_user=recipient_user_id, from_user=request.user.id).delete()
        return Response({'ok': True})
    except:
        return Response({'ok': True})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_manage_friends_data(request):


    required_user = request.user

    print('-----------------------------------')
    print(required_user)
    print('-----------------------------------')

    all_users = User.objects.exclude(email=required_user.email)
    user_data_dict = dict()
    users_serializer = UserSerializer(all_users, many=True)

    all_usrs = User.objects.all()
    usr_serializer = UserSerializer(all_usrs, many=True)

    for user_obj in usr_serializer.data:
        user_data_dict[user_obj['id']] = dict(user_obj)

    all_friends = Friend.objects.friends(required_user)

    all_frs = []
    friend_id_list = []

    for friend_obj in all_friends:
        req_user = friend_obj.id
        friend_id_list.append(req_user)
        all_frs.append(user_data_dict[req_user])

    all_friend_requests = Friend.objects.unrejected_requests(user=required_user)
   
    all_fr_requests = []
    friend_requests_id_list = []

    for fr_obj in all_friend_requests:
        user = fr_obj.from_user
        friend_requests_id_list.append(user.id)
        all_fr_requests.append(user_data_dict[user.id])


    all_sent_friend_requests = Friend.objects.sent_requests(user=required_user)
    
    all_sent_fr_requests = []
    sent_friend_requests_id_list = []

    for sent_friend_req_obj in all_sent_friend_requests:
        user = sent_friend_req_obj.to_user
        sent_friend_requests_id_list.append(user.id)
        all_sent_fr_requests.append(user_data_dict[user.id])
    

    user_id_list = list(User.objects.values_list('id', flat=True))

    display_users = []
    for user_obj in users_serializer.data:
        user_obj['is_friend'] = False
        user_obj['sent_friend_request'] = False
        if user_obj['id'] in friend_id_list:
            user_obj['is_friend'] = True
        elif user_obj['id'] in sent_friend_requests_id_list:
            user_obj['sent_friend_request'] = True
        display_users.append(user_obj) if not user_obj['is_friend'] else ''

    data_dict = {'user_id_list': user_id_list, 'friend_id_list': friend_id_list, 'sent_friend_requests_id_list': sent_friend_requests_id_list, 'friend_requests_id_list': friend_requests_id_list}

    return Response({'ok':True, 'users':display_users, 'friends':all_frs, 'friend_requests':all_fr_requests, 'sent_friend_requests':all_sent_fr_requests, 'data_dict': data_dict})