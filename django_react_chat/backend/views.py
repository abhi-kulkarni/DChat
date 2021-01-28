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
from .serializers import MyTokenObtainPairSerializer, NotificationSerializer, FriendSerializer, FriendRequestSerializer, UserSerializer
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
        friend_requests = manage_friend_request_data([request.user.id], '', None)[request.user.id]
        chat_requests = manage_chat_request_data([request.user.id], '', '', None)[request.user.id]
        notifications = get_all_notifications(request.user.id)
        return Response({'ok': True, 'user': serializer.data, 'is_logged_in': True, 'friend_requests': friend_requests, 'chat_requests': chat_requests, 'notifications': notifications})
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
    from .socket_views import manage_notifications

    post_data = request.data
    recipient_user_id = post_data['recipient_user_id']
    recipient_user = User.objects.get(pk=recipient_user_id)
    notification = []
    try:
        if post_data['action'] == 'add':
            Friend.objects.add_friend(request.user, recipient_user, message='Hi! I would like to be friends with you')      
        elif post_data['action'] == 'remove':
            Friend.objects.remove_friend(request.user, recipient_user)
        elif post_data['action'] == 'accept':
            friend_request = FriendshipRequest.objects.filter(to_user=request.user.id, from_user=recipient_user_id)[0]
            friend_request.accept()
            notification = manage_notifications(request.user, recipient_user, "friends")
        elif post_data['action'] == 'reject':
            friend_request = FriendshipRequest.objects.filter(to_user=request.user.id, from_user=recipient_user_id)[0]
            friend_request.reject()
            friend_request.delete()
        elif post_data['action'] == 'cancel':  
            friend_request = FriendshipRequest.objects.filter(from_user=request.user.id, to_user=recipient_user_id)[0]
            friend_request.delete()
        return Response({'ok': True, 'notification': notification})
    except:
        return Response({'ok': False})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def manage_chats(request):
    from .socket_views import manage_notifications

    post_data = request.data
    recipient_user_id = post_data.get('recipient_user_id', '')
    recipient_user = User.objects.get(pk=recipient_user_id)
    participants = []
    participants.append(recipient_user)
    participants.append(request.user)
    created_chat_id = ''
    req_chat_id = post_data.get('chat_id', '')
    notification = []
    # try:
    if post_data['action'] == 'add':
        ChatFriend.objects.add_friend(request.user, recipient_user, message='Hi! I would like to be friends with you')      
    elif post_data['action'] == 'remove':
        ChatFriend.objects.remove_friend(request.user, recipient_user)
        chat = Chat.objects.get(pk=req_chat_id)
        chat.messages.through.objects.filter(chat_id=chat.pk).delete()
        chat.delete()
    elif post_data['action'] == 'accept':
        chat_friend_request = ChatRequest.objects.filter(to_user=request.user.id, from_user=recipient_user_id)[0]
        chat_friend_request.accept()
        chat_obj = Chat()
        chat_obj.save()
        created_chat_id = chat_obj.id
        for participant in participants:
            chat_obj.participants.add(participant)
        notification = manage_notifications(request.user, recipient_user, "chat")
    elif post_data['action'] == 'reject':
        chat_friend_request = ChatRequest.objects.filter(to_user=request.user.id, from_user=recipient_user_id)[0]
        chat_friend_request.reject()
        chat_friend_request.delete()
    elif post_data['action'] == 'cancel':  
        chat_friend_request = ChatRequest.objects.filter(from_user=request.user.id, to_user=recipient_user_id)[0]
        chat_friend_request.delete()
    return Response({'ok': True, 'chat_id': created_chat_id, 'notification': notification})
    # except:
    # return Response({'ok': False})


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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_chat(request, pk):

    chat = Chat.objects.get(pk=pk)
    participants = chat.participants.all()
    messages = chat.messages.order_by('-timestamp').all()
    c_msgs = []
    curr_user = User.objects.get(email=request.user)
    user_id = curr_user.id
    for chat_msg in messages:
            cleared_msg = json.loads(chat_msg.cleared).get(str(user_id), False)
            if not cleared_msg:
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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_chats(request):

    all_chats = Chat.objects.all()
    chat_data = []
    i = 0
    for chat in all_chats:
        temp = {}
        users = []
        participants = chat.participants.all()
        for participant in participants:
            if participant.id != request.user.id:
                temp['curr_user'] = UserSerializer(participant).data
                usr_obj = {}
                usr_obj['id'] = i
                usr_obj['photo'] = temp['curr_user']['profile_picture']
                usr_obj['name'] = temp['curr_user']['username']
                usr_obj['user_id'] = temp['curr_user']['id']
                usr_obj['chat_id'] = chat.id
                temp['chat'] = usr_obj
                temp['chat']['isFriend'] = ChatFriend.objects.are_friends(request.user, participant) == True
            users.append(participant)
        participants = UserSerializer(users, many=True).data
        temp['chat_id'] = chat.id
        temp['participants'] = participants
        chat_data.append(temp)
        i += 1
    

    return Response({'ok': True, 'chats': chat_data})


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
    notifications = user.notifications.all()

    return Response({'ok': True, 'notifications': notifications})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def manage_requests_last_seen(request):
    
    post_data = request.data
    req_type = post_data['request_type']
    last_seen = post_data['last_seen']

    curr_user = User.objects.get(pk=request.user.id)

    if req_type == 'chat':
        curr_user.chat_request_last_seen = last_seen
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