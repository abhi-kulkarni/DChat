from django.shortcuts import render,HttpResponse
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User, ChatFriend, ChatManager, ChatRequest, Chat, Message, Notification
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
import json
from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import permissions
from .serializers import MyTokenObtainPairSerializer, ChatSerializer, NotificationSerializer, FriendSerializer, FriendRequestSerializer, UserSerializer
from django.contrib.auth.hashers import check_password, make_password
from friendship.models import Friend, Follow, Block, FriendshipRequest 
from django.core.cache import cache
import uuid
from .socket_views import *
import boto
import base64
from decouple import config
from boto.s3.connection import S3Connection
from boto.s3.key import Key
import base64

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
    from .socket_views import manage_friend_request_data, manage_chat_request_data, get_all_notifications

    if request.user:
        serializer = UserSerializer(request.user)
        notifications = get_all_notifications(request.user.id)
        conversation_modal_data = get_conversation_modal_data_method(request)
        return Response({'ok': True, 'user': serializer.data, 'is_logged_in': True, 'notifications': notifications})
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
@permission_classes([AllowAny])
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
    return Response({'ok': True, 'user': serializer.data}, status=status.HTTP_200_OK)
    

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
@permission_classes([IsAuthenticated])
def add_group(request):
    
    post_data = request.data
    # serializer = ChatSerializer(chat_obj)
    return Response({'ok': True, 'group': {}})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_curr_group(request, pk):
    serializer = Chat.objects.objects.get(pk=pk)
    return Response({'ok': True, 'group': serializer.data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_group(request):

    error_msg = 'Some error occured.'
    post_data = request.data
    curr_group = Chat.objects.get(pk=post_data['id'])
    added_participants = []
    is_deleted = False
    is_exit = False
    is_clear = False
    is_removed = False
    removed_participants = []
    deleted_participants = []
    exit_participants = []
    cleared_participants = []
    if post_data['type'] == 'update':
        is_admin = post_data['is_admin']
        participant_change = post_data['participant_change']
        group_name_change = post_data['group_name_change']
        group_image_change = post_data['group_image_change']
        group_description_change = post_data['group_description_change']
        group_admin_change = post_data['group_admin_change']
        if participant_change:
            removed_participants = post_data['removed_participants']
            added_participants = post_data['added_participants']
            if removed_participants:
                for obj in removed_participants:
                    curr_removed_dict = curr_group.removed
                    removed_dict = {}
                    if curr_removed_dict:
                        removed_dict = json.loads(curr_removed_dict) if curr_removed_dict else {}
                    removed_dict[str(obj)] = True
                    curr_group.removed = json.dumps(removed_dict)
            if added_participants:
                for obj in added_participants:
                    curr_removed_dict = curr_group.removed
                    removed_dict = {}
                    if curr_removed_dict:
                        removed_dict = json.loads(curr_removed_dict) if curr_removed_dict else {}
                    removed_dict[str(obj)] = False
                    curr_group.removed = json.dumps(removed_dict)
        curr_group.group_name = post_data['group_name']
        curr_group.group_description = post_data['group_description']
        curr_group.group_profile_picture = post_data['group_profile_picture']
        curr_group.admin = json.dumps(post_data["admin"])
        participants = post_data['participants']
        p_list = []
        curr_group.participants.clear()
        curr_has_exit_group_dict = json.loads(curr_group.has_exit)
        curr_remove_group_dict = json.loads(curr_group.removed)
        
        for participant_obj in participants:
            user = User.objects.get(pk=participant_obj['id'])
            curr_group.participants.add(user)
            p_list.append(UserSerializer(user).data)
            curr_has_exit_group_dict[str(participant_obj['id'])] = False
            curr_remove_group_dict[str(participant_obj['id'])] = False

        curr_group.removed = json.dumps(curr_remove_group_dict)
        curr_group.has_exit = json.dumps(curr_has_exit_group_dict)
        curr_group.save()
        if user.id in removed_participants:
            is_removed = True
        if user.id in deleted_participants:
            is_deleted = True
        if user.id in exit_participants:
            is_exit = True
        if user.id in cleared_participants:
            is_clear = True
        curr_group_serializer = ChatSerializer(curr_group).data
        curr_group_serializer['participants_detail'] = p_list
        admin_list = []
        for user_obj in json.loads(curr_group.admin):
            curr_user = User.objects.get(pk=user_obj)
            if curr_user:
                admin_list.append(UserSerializer(curr_user, many=False).data)
        curr_group_serializer["admin_users"] = admin_list
        curr_group_serializer["participant_change"] = participant_change
        curr_group_serializer["group_admin_change"] = group_admin_change
        curr_group_serializer["group_name_change"] = group_name_change
        curr_group_serializer["group_description_change"] = group_description_change
        curr_group_serializer["group_image_change"] = group_image_change
        curr_group_serializer["removed_participants"] = removed_participants
        curr_group_serializer["added_participants"] = added_participants
        curr_group_serializer["exit_participants"] = exit_participants
        curr_group_serializer["is_clear"] = is_clear
        curr_group_serializer["is_removed"] = is_removed
        curr_group_serializer["is_deleted"] = is_deleted
        curr_group_serializer["is_exit"] = is_exit
        return Response({'ok': True, 'group': curr_group_serializer}, status=status.HTTP_200_OK)
    elif post_data['type'] == 'exit':
        curr_user_id = post_data['curr_user_id']
        curr_exit_dict = curr_group.exit
        curr_has_exit_dict = curr_group.has_exit
        curr_group_admins = json.loads(curr_group.admin) if curr_group.admin else []
        updated_admins = []
        exit_dict = {}
        has_exit_dict = {}

        for admin in curr_group_admins:
            if admin != curr_user_id:
                updated_admins.append(admin)

        if curr_exit_dict:
            exit_dict = json.loads(curr_exit_dict) if curr_exit_dict else {}
            exit_dict[str(curr_user_id)] = True

        if curr_has_exit_dict:
            has_exit_dict = json.loads(curr_has_exit_dict) if curr_has_exit_dict else {}
            has_exit_dict[str(curr_user_id)] = True
        
        for participant in curr_group.participants.all():
            if participant.id == curr_user_id:
                curr_group.participants.remove(participant)

        participants = list(curr_group.participants.all())

        if len(updated_admins) == 0:
            updated_admins.append(participants[0].id)
        
        curr_group.exit = json.dumps(exit_dict)
        curr_group.has_exit = json.dumps(has_exit_dict)
        curr_group.admin = json.dumps(updated_admins)
        curr_group.save()

        p_list = []
        for participant_obj in participants:
            p_list.append(UserSerializer(participant_obj).data)

        curr_group_serializer = ChatSerializer(curr_group).data
        curr_group_serializer['participants_detail'] = p_list
        curr_group_serializer['is_exit'] = True

        admin_list = []
        for user_obj in json.loads(curr_group.admin):
            curr_user = User.objects.get(pk=user_obj)
            if curr_user:
                admin_list.append(UserSerializer(curr_user, many=False).data)
        curr_group_serializer["admin_users"] = admin_list
        
        return Response({'ok': True, 'group': curr_group_serializer}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def delete_group(request, pk):
    
    curr_group = Chat.objects.get(pk=pk)
    curr_user_id = pk
    curr_delete_dict = curr_group.deleted
    delete_dict = {}
    if curr_delete_dict:
        delete_dict = json.loads(curr_delete_dict) if curr_delete_dict else {}
    delete_dict[str(curr_user_id)] = True
    curr_group.save()
    return Response({'ok': True}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
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
@permission_classes([AllowAny])
def reset_password_signin(request):

    post_data = request.data
    user_data = User.objects.get(email=post_data['email'])
    if user_data:
        user_data.set_password(post_data['password'])
        user_data.save()
        return Response({'ok': True})
    else:
        return Response({'ok': False})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manage_friends(request):
    from .socket_views import manage_notifications

    post_data = request.data
    recipient_user_id = post_data['recipient_user_id']
    recipient_user = User.objects.get(pk=recipient_user_id)
    notification = []
    err_msg = ""
    data = {}
    # try:
    if post_data['action'] == 'add':
        data = Friend.objects.add_friend(request.user, recipient_user, message='Hi! I would like to be friends with you')      
        notification = manage_notifications(request.user, recipient_user, "friend_requests")
    elif post_data['action'] == 'remove':
        try:
            Friend.objects.remove_friend(request.user, recipient_user)
        except:
            err_msg = 'Some error occured. Please refresh.'
            return Response({'ok': False, 'error': err_msg})
    elif post_data['action'] == 'accept':
        friend_request = FriendshipRequest.objects.filter(to_user=request.user.id, from_user=recipient_user_id)[0]
        try:
            friend_request.accept()
        except:
            err_msg = 'Some error occured. Please refresh.'
            return Response({'ok': False, 'error': err_msg})
        notification = manage_notifications(request.user, recipient_user, "friends")
    elif post_data['action'] == 'reject':
        friend_request = FriendshipRequest.objects.filter(to_user=request.user.id, from_user=recipient_user_id)[0]
        friend_request.reject()
        friend_request.delete()
    elif post_data['action'] == 'cancel':  
        friend_request = FriendshipRequest.objects.filter(from_user=request.user.id, to_user=recipient_user_id)[0]
        friend_request.delete()
    if data and not isinstance(data, FriendshipRequest) and data["err"]:
        err_msg = data["err_msg"]
        return Response({'ok': False, 'error': err_msg})
    return Response({'ok': True, 'notification': notification})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manage_chats(request):
    from .socket_views import manage_notifications

    post_data = request.data
    temp = {}
    err_msg = ""
    accept_type = "new"
    if post_data["is_group"]:
        participants = post_data['participants']
        chat_obj = Chat()
        chat_obj.is_group = post_data["is_group"]
        chat_obj.group_profile_picture = post_data["group_profile_picture"]
        chat_obj.group_name = post_data["group_name"]
        chat_obj.group_description = post_data["group_description"]
        chat_obj.admin = json.dumps(post_data["admin"])
        chat_obj.save()
        participant_detail_list = []
        for participant in participants:
            user = User.objects.get(pk=participant['id'])
            participant_detail_list.append(UserSerializer(user, many=False).data)
            chat_obj.participants.add(user)
        created_group = ChatSerializer(chat_obj, many=False).data
        created_group['participants_detail'] = participant_detail_list
        admin_list = []
        for user_obj in json.loads(chat_obj.admin):
            curr_user = User.objects.get(pk=user_obj)
            if curr_user:
                admin_list.append(UserSerializer(curr_user, many=False).data)
        created_group["admin_users"] = admin_list
        return Response({"ok": True, "is_group": True, "group": created_group, "accept_type": accept_type})
    else:
        recipient_user_id = post_data.get('recipient_user_id', '')
        user_id = post_data.get('user_id', '')
        unique_chat_id = str(user_id) + '_' + str(recipient_user_id)
        rev_unique_chat_id = str(recipient_user_id) +  '_' + str(user_id)
        recipient_user = User.objects.get(pk=recipient_user_id)
        participants = []
        participants.append(recipient_user)
        participants.append(request.user)
        req_chat_id = post_data.get('chat_id', '')
        notification = {}
        data = {}
        created_conversation = {}
        unique_chat_id_list = list(Chat.objects.all().values_list('unique_id', flat=True))
        # try:
        if post_data['action'] == 'add':
            notification = manage_notifications(request.user, recipient_user, "conversation_requests")
            data = ChatFriend.objects.add_friend(request.user, recipient_user, message='Hi! I would like to be friends with you')
        elif post_data['action'] == 'delete':
            p_list = []
            chat = Chat.objects.get(pk=req_chat_id)
            curr_delete_chat = chat.deleted
            delete_chat_dict = {}
            if delete_chat_dict:
                delete_chat_dict = json.loads(curr_delete_chat)
            participants = chat.participants.all()
            for p in participants:
                p_list.append(p.id) 
            if recipient_user_id in p_list:
                delete_chat_dict[str(recipient_user_id)] = True
            chat.deleted = json.dumps(delete_chat_dict)
            chat.messages.all().update(deleted=json.dumps(delete_chat_dict))
            chat.unique_id = unique_chat_id
            chat.save()
        elif post_data['action'] == 'remove':
            try:
                ChatFriend.objects.remove_friend(request.user, recipient_user)
            except:
                err_msg = 'Some error occured. Please refresh.'
                return Response({'ok': False, 'error': err_msg})
            # chat = Chat.objects.get(pk=req_chat_id)
            # chat.messages.clear()
            # chat.participants.clear()
            # chat.delete()
        elif post_data['action'] == 'accept':
            notification = manage_notifications(request.user, recipient_user, "conversations")
            chat_friend_request = ChatRequest.objects.filter(to_user=request.user.id, from_user=recipient_user_id)
            if chat_friend_request:
                chat_friend_request = chat_friend_request[0]
            try:
                chat_friend_request.accept()
            except:
                err_msg = 'Some error occured. Please refresh.'
                return Response({'ok': False, 'error': err_msg})
            if unique_chat_id not in unique_chat_id_list and rev_unique_chat_id not in unique_chat_id_list:
                chat_obj = Chat()
                chat_obj.unique_id = unique_chat_id
                chat_obj.save()
                for participant in participants:
                    chat_obj.participants.add(participant)
                created_conversation = ChatSerializer(chat_obj, many=False).data
                created_conversation['user'] = UserSerializer(recipient_user, many=False).data
            else:
                accept_type = "accept_old"
        elif post_data['action'] == 'reject':
            chat_friend_request = ChatRequest.objects.filter(to_user=request.user.id, from_user=recipient_user_id)[0]
            chat_friend_request.reject()
            chat_friend_request.delete()
        elif post_data['action'] == 'cancel':  
            chat_friend_request = ChatRequest.objects.filter(from_user=request.user.id, to_user=recipient_user_id)[0]
            chat_friend_request.delete()
        if data and not isinstance(data, ChatRequest) and data["err"]:
            err_msg = data["err_msg"]
            return Response({'ok': False, 'error': err_msg})
        return Response({'ok': True, 'is_group': False, 'notification': notification, 'extra_data': temp, 'created_conversation': created_conversation, "accept_type": accept_type})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_manage_friends_data(request):

    required_user = request.user

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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_friends_modal_data(request):
    
    #USERS
    all_users = User.objects.exclude(email=request.user.email)

    user_data_dict = dict()
    user_serializer = UserSerializer(all_users, many=True)

    all_usrs = User.objects.all()
    usr_serializer = UserSerializer(all_usrs, many=True)

    for user_obj in usr_serializer.data:
        user_data_dict[user_obj['id']] = dict(user_obj)

    # SENT FRIEND REQUESTS
    
    all_sent_friend_requests = Friend.objects.sent_requests(user=request.user)

    all_sent_fr_requests = []
    sent_friend_requests_id_list = []

    for sent_friend_req_obj in all_sent_friend_requests:
        user = sent_friend_req_obj.to_user
        sent_friend_requests_id_list.append(user.id)
        all_sent_fr_requests.append(user_data_dict[user.id])

    # FRIENDS

    all_friends = Friend.objects.friends(request.user)

    all_frs = []
    friend_id_list = []

    for friend_obj in all_friends:
        req_user = friend_obj.id
        friend_id_list.append(req_user)
        curr_user = user_data_dict[req_user]
        all_frs.append(curr_user)

    # Clear cache

        for key in list(cache._cache.keys()):
            if 'sfr' or 'fr' in key:
                cache.delete(key.replace(':1:', ''))
                
    # FRIEND REQUESTS
    all_friend_requests = Friend.objects.unrejected_requests(user=request.user)

    user_data_dict = dict()
    all_usrs = User.objects.all()
    usr_serializer = UserSerializer(all_usrs, many=True)

    for user_obj in usr_serializer.data:
        curr_usr_obj = dict(user_obj)
        user_data_dict[user_obj['id']] = curr_usr_obj

    all_fr_requests = []
    friend_requests_id_list = []

    for fr_obj in all_friend_requests:
        user = fr_obj.from_user
        friend_requests_id_list.append(user.id)
        curr_user_data = user_data_dict[user.id]
        curr_user_data['friend_request_created_on'] = str(fr_obj.created)
        all_fr_requests.append(curr_user_data)

    # USERS

    users = []
    for user_obj in user_serializer.data:
        req_user = user_obj['id']
        curr_user = user_data_dict[req_user]
        if req_user in sent_friend_requests_id_list:
            curr_user['sent_friend_request'] = True
        if req_user in friend_id_list:
            curr_user['is_friend'] = True
        users.append(curr_user)

    curr_user_data = User.objects.get(pk=request.user.id)

    return Response({"ok": True, "friend_request_last_seen": str(curr_user_data.friend_request_last_seen), "user_data_dict": user_data_dict, "modal_users": users, "modal_friends": all_frs, "modal_friend_requests": all_fr_requests, "modal_sent_friend_requests": all_sent_fr_requests}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_conversation_modal_data(request):
    
    #USERS
    all_users = User.objects.exclude(email=request.user.email)

    user_data_dict = dict()
    user_serializer = UserSerializer(all_users, many=True)

    all_usrs = User.objects.all()
    usr_serializer = UserSerializer(all_usrs, many=True)

    for user_obj in usr_serializer.data:
        user_data_dict[user_obj['id']] = dict(user_obj)

    # SENT CONVERSATION REQUESTS
    
    all_sent_friend_requests = ChatFriend.objects.sent_requests(user=request.user)

    all_sent_fr_requests = []
    sent_friend_requests_id_list = []

    for sent_friend_req_obj in all_sent_friend_requests:
        user = sent_friend_req_obj.to_user
        sent_friend_requests_id_list.append(user.id)
        all_sent_fr_requests.append(user_data_dict[user.id])

    # CONVERSATIONS
    chat_friends = ChatFriend.objects.chat_friends(request.user)

    all_chat_frs = []
    chat_friend_id_list = []

    for chat_friend_obj in chat_friends:
        req_user = chat_friend_obj.id
        chat_friend_id_list.append(req_user)
        all_chat_frs.append(user_data_dict[req_user])
    
    # FRIENDS
    all_friends = Friend.objects.friends(request.user)

    all_frs = []
    friend_id_list = []

    for friend_obj in all_friends:
        req_user = friend_obj.id
        friend_id_list.append(req_user)
        curr_user = user_data_dict[req_user]
        if req_user in sent_friend_requests_id_list:
            curr_user['sent_conversation_request'] = True
        if req_user in chat_friend_id_list:
            curr_user['has_conversation'] = True
        all_frs.append(curr_user)

    # Clear cache

        for key in list(cache._cache.keys()):
            if 'scfr' or 'cfr' in key:
                cache.delete(key.replace(':1:', ''))
                
    # CONVERSATION REQUESTS
    all_friend_requests = ChatFriend.objects.unrejected_requests(user=request.user)

    user_data_dict = dict()
    all_usrs = User.objects.all()
    usr_serializer = UserSerializer(all_usrs, many=True)

    for user_obj in usr_serializer.data:
        curr_usr_obj = dict(user_obj)
        curr_usr_obj['chat_id'] = ""
        user_data_dict[user_obj['id']] = curr_usr_obj

    all_fr_requests = []
    friend_requests_id_list = []

    for fr_obj in all_friend_requests:
        user = fr_obj.from_user
        friend_requests_id_list.append(user.id)
        curr_user_data = user_data_dict[user.id]
        curr_user_data['conversation_request_created_on'] = str(fr_obj.created)
        all_fr_requests.append(curr_user_data)

    conversation_data = get_all_conversations(request.user)
    all_conversations = conversation_data['conversations']
    all_groups = conversation_data['groups']
    all_conv_data = all_conversations + all_groups

    curr_user_data = User.objects.get(pk=request.user.id)

    return Response({"ok": True, "user_data_dict": user_data_dict, "all_conv_data": all_conv_data, "conversation_request_last_seen": str(curr_user_data.conversation_request_last_seen), "all_groups":all_groups, "all_conversations": all_conversations, "users": user_serializer.data, "modal_friends": all_frs, "modal_conversations": all_chat_frs, "modal_conversation_requests": all_fr_requests, "modal_sent_conversation_requests": all_sent_fr_requests}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_friends(request):
    
    all_users = User.objects.exclude(email=request.user.email)

    user_data_dict = dict()
    user_serializer = UserSerializer(all_users, many=True)

    all_usrs = User.objects.all()
    usr_serializer = UserSerializer(all_usrs, many=True)

    for user_obj in usr_serializer.data:
        user_data_dict[user_obj['id']] = dict(user_obj)

    all_friends = Friend.objects.friends(request.user)

    all_frs = []
    friend_id_list = []

    for friend_obj in all_friends:
        req_user = friend_obj.id
        friend_id_list.append(req_user)
        all_frs.append(user_data_dict[req_user])

    if all_users:
        serializer = UserSerializer(all_users, many=True)
        return Response({"ok": True, "users": user_serializer.data, "friends": all_frs}, status=status.HTTP_200_OK)
    else:
        return Response({"ok": False, "users": [], "friends": [], "error": "Some error occured."})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def get_chat(request):

    post_data = request.data
    chat_id = post_data.get('chat_id', '')
    user_id = post_data.get('user_id', '')
    recipient_user_id = ''
    chat = Chat.objects.get(pk=chat_id)
    participants = chat.participants.all()
    for p_obj in participants:
        if p_obj.id!=user_id:
            recipient_user_id = p_obj.id
    messages = chat.messages.order_by('-timestamp').all()
    c_msgs = []
    curr_user = User.objects.get(email=request.user)
    user_id = curr_user.id
    for chat_msg in messages:
        cleared_msg = json.loads(chat_msg.cleared).get(str(recipient_user_id), False)
        deleted_msg = json.loads(chat_msg.deleted).get(str(recipient_user_id), False)
        if not cleared_msg and not deleted_msg:
            c_msgs.append(chat_msg)
    users = []
    user = None
    chat_data = {}
    chat_data[pk] = {}
    for participant in participants:
        if participant.id != request.user.id:
            user = UserSerializer(participant)
        users.append(participant)
    
    curr_user = user.data if user else {}
    participants = UserSerializer(users, many=True).data
    msgs = messages_to_json(c_msgs, pk)
    chat_data[pk] = msgs
    return Response({'ok': True, 'participants': participants, 'curr_user': curr_user, 'chat_data': chat_data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def clear_chat(request):

    post_data = request.data
    chat_id = post_data.get('chat_id', '')
    user_id = post_data.get('user_id', '')
    
    chat = Chat.objects.get(pk=chat_id)
    participants = chat.participants.all()
    p_list = []
    for p in participants:
        p_list.append(p.id)        
    curr_clear_chat = chat.cleared
    clear_chat_dict = {}
    if clear_chat_dict:
        clear_chat_dict = json.loads(curr_clear_chat)
    if user_id in p_list:
        clear_chat_dict[str(user_id)] = True
    chat.cleared = json.dumps(clear_chat_dict)
    chat.messages.all().update(cleared=json.dumps(clear_chat_dict))
    chat.save()

    return Response({'ok': True})

def get_all_conversations(user):

    all_chats = Chat.objects.all()
    conversations = []
    groups = []
    recipient_user = {}
    for chat in all_chats:
        if chat.is_group:
            p_detail_list = []
            removed_participants = []
            deleted_participants = []
            exit_participants = []
            cleared_participants = []
            has_exit_participants = []
            is_deleted = False
            is_exit = False
            is_clear = False
            is_removed = False
            removed_users_dict = json.loads(chat.removed) if chat.removed else {}
            deleted_users_dict = json.loads(chat.deleted) if chat.deleted else {}
            exit_users_dict = json.loads(chat.exit) if chat.exit else {}
            has_exit_users_dict = json.loads(chat.has_exit) if chat.has_exit else {}
            clear_users_dict = json.loads(chat.cleared) if chat.cleared else {}
            for obj in removed_users_dict:
                if removed_users_dict[obj]:
                    removed_participants.append(int(obj))
            for obj in deleted_users_dict:
                if deleted_users_dict[obj]:
                    deleted_participants.append(int(obj))
            for obj in has_exit_users_dict:
                if has_exit_users_dict[obj]:
                    has_exit_participants.append(int(obj))
            for obj in exit_users_dict:
                if exit_users_dict[obj]:
                    exit_participants.append(int(obj))
            for obj in clear_users_dict:
                if clear_users_dict[obj]:
                    cleared_participants.append(int(obj))
            if user.id in removed_participants:
                is_removed = True
            if user.id in deleted_participants:
                is_deleted = True
            if user.id in has_exit_participants:
                is_exit = True
            if user.id in cleared_participants:
                is_clear = True
            participant_list = list(chat.participants.values_list('id', flat=True))
            if (user.id in exit_participants) or (user.id in removed_participants) or (user.id in participant_list) or (user.id in json.loads(chat.admin) if chat.admin else []):
                for p_obj in participant_list:
                    curr_user = UserSerializer(User.objects.get(pk=p_obj)).data
                    p_detail_list.append(curr_user)
                conversation = ChatSerializer(chat, many=False).data
                conversation['participants_detail'] = p_detail_list
                admin_list = []
                for user_obj in json.loads(chat.admin):
                    curr_user = User.objects.get(pk=user_obj)
                    if curr_user:
                        admin_list.append(UserSerializer(curr_user, many=False).data)
                conversation["admin_users"] = admin_list
                conversation["is_clear"] = is_clear
                conversation["is_removed"] = is_removed
                conversation["is_deleted"] = is_deleted
                conversation["is_exit"] = is_exit
                groups.append(conversation)
        else:
            temp = {}
            users = []
            participants = chat.participants.all()
            participant_list = list(chat.participants.values_list('id', flat=True))
            if user.id in participant_list:
                for participant in participants:
                    if participant.id != user.id:
                        recipient_user = UserSerializer(participant, many=False).data
                conversation = ChatSerializer(chat, many=False).data
                conversation['user'] = recipient_user
                conversations.append(conversation)
    
    return {'conversations':conversations, 'groups': groups}

def get_conversation_modal_data_method(request):

    #USERS
    all_users = User.objects.exclude(email=request.user.email)

    user_data_dict = dict()
    user_serializer = UserSerializer(all_users, many=True)

    all_usrs = User.objects.all()
    usr_serializer = UserSerializer(all_usrs, many=True)

    conversation_data = get_all_conversations(request.user)
    all_conversations = conversation_data['conversations']
    all_groups = conversation_data['groups']
    all_conv_data = all_conversations + all_groups
    conversation_delete_dict = {}
    remove_dict = {}
    delete_dict = {}
    clear_dict = {}

    for conv in all_conversations:
        recipient_user = User.objects.get(pk=conv['user']['id'])
        remove_dict[recipient_user.id] = ChatFriend.objects.are_friends(request.user, recipient_user) == True
    
    conversation_delete_dict['remove'] = remove_dict

    for user_obj in usr_serializer.data:
        user_data_dict[user_obj['id']] = dict(user_obj)

    # SENT CONVERSATION REQUESTS
    
    all_sent_friend_requests = ChatFriend.objects.sent_requests(user=request.user)

    all_sent_fr_requests = []
    sent_friend_requests_id_list = []

    for sent_friend_req_obj in all_sent_friend_requests:
        user = sent_friend_req_obj.to_user
        sent_friend_requests_id_list.append(user.id)
        all_sent_fr_requests.append(user_data_dict[user.id])

    # CONVERSATIONS
    chat_friends = ChatFriend.objects.chat_friends(request.user)

    all_chat_frs = []
    chat_friend_id_list = []

    for chat_friend_obj in chat_friends:
        req_user = chat_friend_obj.id
        chat_friend_id_list.append(req_user)
        all_chat_frs.append(user_data_dict[req_user])
    
    # FRIENDS
    all_friends = Friend.objects.friends(request.user)

    all_frs = []
    friend_id_list = []

    for friend_obj in all_friends:
        req_user = friend_obj.id
        friend_id_list.append(req_user)
        curr_user = user_data_dict[req_user]
        if req_user in sent_friend_requests_id_list:
            curr_user['sent_conversation_request'] = True
        if req_user in chat_friend_id_list:
            curr_user['has_conversation'] = True
        all_frs.append(curr_user)

    # CONVERSATION REQUESTS
    all_friend_requests = ChatFriend.objects.unrejected_requests(user=request.user)

    user_data_dict = dict()
    all_usrs = User.objects.all()
    usr_serializer = UserSerializer(all_usrs, many=True)

    for user_obj in usr_serializer.data:
        curr_usr_obj = dict(user_obj)
        curr_usr_obj['chat_id'] = ""
        user_data_dict[user_obj['id']] = curr_usr_obj

    all_fr_requests = []
    friend_requests_id_list = []

    for fr_obj in all_friend_requests:
        user = fr_obj.from_user
        friend_requests_id_list.append(user.id)
        curr_user_data = user_data_dict[user.id]
        curr_user_data['chat_request_created_on'] = str(fr_obj.created)
        all_fr_requests.append(curr_user_data)

    curr_user_data = User.objects.get(pk=request.user.id)

    return {"conversation_delete_dict": conversation_delete_dict, "all_conv_data":all_conv_data, "last_seen_conversation_requests": str(curr_user_data.conversation_request_last_seen), "all_groups": all_groups, "all_conversations": all_conversations, "users": user_serializer.data, "modal_friends": all_frs, "modal_conversations": all_chat_frs, "modal_conversation_requests": all_fr_requests, "modal_sent_conversation_requests": all_sent_fr_requests}

def messages_to_json(messages, chat_id):
        result = []
        if messages:
            for message in messages:
                result.append(message_to_json(message, chat_id))
        return result

def message_to_json(message, chat_id):
    return {
        'id': message.id,
        'author_id': message.user.id,
        'author': message.user.username,
        'content': message.content,
        'timestamp': str(message.timestamp),
        'chatId': chat_id,
        'message_type': message.message_type
    }

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_notifications(request):
    
    user = User.objects.get(pk=request.user)
    notifications = user.notifications.order_by('-created_on').all()[:10]

    return Response({'ok': True, 'notifications': notifications})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manage_requests_last_seen(request):
    
    post_data = request.data
    req_type = post_data['request_type']
    last_seen = post_data['last_seen']

    curr_user = User.objects.get(pk=request.user.id)

    if req_type == 'conversations':
        curr_user.conversation_request_last_seen = last_seen
    elif req_type == 'friends':
        curr_user.friend_request_last_seen = last_seen
    
    curr_user.save()

    return Response({'ok': True})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_recent_msg_data(request):
    
    curr_user = User.objects.get(pk=request.user.id)
    chats = Chat.objects.all()
    recent_msg_data_dict = {}
    all_chats = get_all_chats_data(curr_user.id)
   
    return Response({'ok': True, 'chats': all_chats['chat_data'], 'last_seen': all_chats['last_seen']})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manage_notifications(request):
    
    post_data = request.data

    recieved_notifications = post_data.get('notifications', '')

    if post_data['type'] == 'add':
        notification = Notification.objects.create(
            friend = post_data['friend']['id'],
            message = post_data['msg'],
            participants = post_data['participants'],
            read = post_data.get('read', False),
        )
        current_user = User.objects.get(pk=request.user.id)
        current_user.notifications.add(notification)
        current_user.save()
        notification_data_serializer = NotificationSerializer(notification)

        return Response({'ok': True, 'notification': notification_data_serializer.data})
    else:
        notification_list = []

        for notification in recieved_notifications:
            notification = Notification.objects.get(pk=notification['id'])
            notification.read = True
            notification.save()
            notification_list.append(notification)

        notification_serializer = NotificationSerializer(notification_list, many=True)

        return Response({'ok': True, 'notifications': notification_serializer.data})

    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def set_last_seen(request):
    
    post_data = request.data

    chat_id = post_data.get('chat_id', '')
    user_id = post_data.get('curr_user_id', '')
    last_seen = post_data.get('last_seen', '')
    chat = Chat.objects.get(pk=chat_id)
    curr_last_seen = chat.last_seen
    last_seen_dict = {}
    if curr_last_seen:
        last_seen_dict = json.loads(curr_last_seen)
    last_seen_dict[str(user_id)] = last_seen
    chat.last_seen = json.dumps(last_seen_dict)
    chat.save()

    return Response({'ok': True, 'last_seen': chat.last_seen})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_chat_image(request):

    post_data = request.data
    input_upload_file = post_data['image']
    upload_filename = post_data['name']
    upload_file_type = post_data['type']
    chat_id = post_data['chatId']

    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
    bucket_name = config('AWS_STORAGE_BUCKET_NAME')

    try:
        img = request.FILES.get('image')
        session = boto3.Session(
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        s3 = session.resource('s3')

        aws_file_dir = 'chat/'+chat_id+'/'+img.name
        s3.Bucket(bucket_name).put_object(Key='chat/'+chat_id+'/%s' % img.name, Body=img)
        pre_signed_url = get_presigned_url(aws_file_dir)

    except e:
        return Response({'ok': False})
    
    return Response({'ok': True, 'image_url': pre_signed_url})