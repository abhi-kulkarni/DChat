import json
from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import permissions
from .serializers import UserSerializer, NotificationSerializer, RoomSerializer
from django.contrib.auth.hashers import check_password, make_password
from friendship.models import Friend, Follow, Block, FriendshipRequest
from .models import User, ChatFriend, ChatManager, ChatRequest, Chat, Notification, Room
from django.core.cache import cache
from channels.db import database_sync_to_async

def manage_friend_request_data(ip, action, notification_data):
    
    op_dict = {}
    
    for user_id in ip:

        recieved_user = User.objects.get(pk=user_id)
        all_users = User.objects.exclude(email=recieved_user.email)
        user_data_dict = dict()
        users_serializer = UserSerializer(all_users, many=True)

        all_usrs = User.objects.all()
        usr_serializer = UserSerializer(all_usrs, many=True)

        for user_obj in usr_serializer.data:
            user_data_dict[user_obj['id']] = dict(user_obj)

        # Clear cache

        for key in list(cache._cache.keys()):
            if 'sfr' or 'fr' in key:
                cache.delete(key.replace(':1:', ''))

        all_friends = Friend.objects.friends(recieved_user)

        all_frs = []
        friend_id_list = []

        for friend_obj in all_friends:
            req_user = friend_obj.id
            friend_id_list.append(req_user)
            all_frs.append(user_data_dict[req_user])

        all_friend_requests = Friend.objects.unrejected_requests(user=recieved_user)
    
        all_fr_requests = []
        friend_requests_id_list = []

        for fr_obj in all_friend_requests:
            user = fr_obj.from_user
            friend_requests_id_list.append(user.id)
            all_fr_requests.append(user_data_dict[user.id])


        all_sent_friend_requests = Friend.objects.sent_requests(user=recieved_user)
        
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
        data = {'users' :display_users, 'friends':all_frs, 'friend_requests':all_fr_requests, 'sent_friend_requests':all_sent_fr_requests, 'data_dict': data_dict}
        op_dict[user_id] = data
        op_dict[user_id]['action'] = action
        op_dict[user_id]['notification'] = notification_data[str(user_id)] if notification_data else None

    return op_dict



def manage_chat_request_data(ip, action, chat_id, notification_data):
    
    op_dict = {}
    
    for user_id in ip:

        recieved_user = User.objects.get(pk=user_id)
        all_users = User.objects.exclude(email=recieved_user.email)
        user_data_dict = dict()
        users_serializer = UserSerializer(all_users, many=True)

        all_usrs = User.objects.all()
        usr_serializer = UserSerializer(all_usrs, many=True)

        for user_obj in usr_serializer.data:
            user_data_dict[user_obj['id']] = dict(user_obj)

        # Clear cache

        for key in list(cache._cache.keys()):
            if 'scfr' or 'cfr' in key:
                cache.delete(key.replace(':1:', ''))

        all_friends = ChatFriend.objects.chat_friends(recieved_user)

        all_frs = []
        friend_id_list = []

        for friend_obj in all_friends:
            req_user = friend_obj.id
            friend_id_list.append(req_user)
            all_frs.append(user_data_dict[req_user])

        recent_msg_data_dict = get_recent_msg_data(user_id, "fetch")

        all_chats = Chat.objects.all()
        chat_data = []
        i = 0
        for chat in all_chats:
            temp = {}
            users = []
            participants = chat.participants.all()
            for participant in participants:
                if participant.id != user_id:
                    temp['curr_user'] = UserSerializer(participant).data
                    usr_obj = {}
                    usr_obj['id'] = i
                    usr_obj['photo'] = temp['curr_user']['profile_picture']
                    usr_obj['name'] = temp['curr_user']['username']
                    usr_obj['user_id'] = temp['curr_user']['id']
                    usr_obj['chat_id'] = str(chat.id)
                    usr_obj['last_seen'] = json.loads(chat.last_seen)[str(participant.id)] if (chat.last_seen and str(participant.id) in json.loads(chat.last_seen)) else ''
                    usr_obj['author_id'] = recent_msg_data_dict[str(chat.id)]['author_id'] if str(chat.id) in recent_msg_data_dict else ''
                    usr_obj['text'] = recent_msg_data_dict[str(chat.id)]['content'] if str(chat.id) in recent_msg_data_dict else ''
                    temp['chat'] = usr_obj
                    temp['chat']['isFriend'] = ChatFriend.objects.are_friends(recieved_user, participant) == True
                users.append(participant)
            participants = UserSerializer(users, many=True).data
            temp['chat_id'] = str(chat.id)
            temp['participants'] = participants
            chat_data.append(temp)
            i += 1

        all_friend_requests = ChatFriend.objects.unrejected_requests(user=recieved_user)
    
        all_fr_requests = []
        friend_requests_id_list = []

        for fr_obj in all_friend_requests:
            user = fr_obj.from_user
            friend_requests_id_list.append(user.id)
            all_fr_requests.append(user_data_dict[user.id])


        all_sent_friend_requests = ChatFriend.objects.sent_requests(user=recieved_user)
        
        all_sent_fr_requests = []
        sent_friend_requests_id_list = []

        for sent_friend_req_obj in all_sent_friend_requests:
            user = sent_friend_req_obj.to_user
            sent_friend_requests_id_list.append(user.id)
            all_sent_fr_requests.append(user_data_dict[user.id])
        

        user_id_list = list(User.objects.values_list('id', flat=True))

        display_users = []
        for user_obj in users_serializer.data:
            user_obj['is_chat'] = False
            user_obj['sent_chat_request'] = False
            if user_obj['id'] in friend_id_list:
                user_obj['is_chat'] = True
            elif user_obj['id'] in sent_friend_requests_id_list:
                user_obj['sent_chat_request'] = True
            display_users.append(user_obj) if not user_obj['is_chat'] else ''

        data_dict = {'user_id_list': user_id_list, 'chat_id_list': friend_id_list, 'sent_chat_requests_id_list': sent_friend_requests_id_list, 'chat_requests_id_list': friend_requests_id_list}
        data = {'friends' :display_users, 'chats':all_frs, 'chat_requests':all_fr_requests, 'sent_chat_requests':all_sent_fr_requests, 'data_dict': data_dict, 'reqd_chat_data': chat_data}
        curr_chat_data = {}
        for obj in chat_data:
            if obj['chat_id'] == chat_id:
                curr_chat_data = obj['chat']
        op_dict[user_id] = data
        op_dict[user_id]['action'] = action
        op_dict[user_id]['chat_id'] = chat_id
        op_dict[user_id]['curr_chat_data'] = curr_chat_data
        op_dict[user_id]['notification'] = notification_data[str(user_id)] if notification_data else None

    return op_dict

def get_user(user_id):

    return User.objects.get(pk=user_id)

def get_current_chat(chat_id):

    return Chat.objects.get(pk=chat_id)


def get_last_10_messages(chat_id, user_id):

    chat = Chat.objects.get(pk=chat_id)
    # recent_msg_data = get_recent_msg_data(user_id)
    chat_msgs = chat.messages.order_by('-timestamp').all()[:10]
    return {'chat_msgs': chat_msgs, 'recent_msg_data': {}}


def get_all_notifications(user_id):
    
    user = User.objects.get(pk=user_id)
    notifications = user.notifications.all()

    notification_serializer = NotificationSerializer(notifications, many=True)

    return notification_serializer.data


def manage_notifications(user, recipient_user, notification_type):

    users = [user, recipient_user]
    notification_dict = {}
    i = 1
    message = ''
    if notification_type == 'chat':
        message += 'You can now chat with '
    else:
        message += 'You are now friends with '
    for user_obj in users:
        notification = Notification.objects.create(
                friend = user_obj.id,
                message = message + users[i].username,
                participants = [user.id, recipient_user.id],
                notification_type = notification_type
            )
        current_user = User.objects.get(pk=user_obj.id)
        current_user.notifications.add(notification)
        current_user.save()

        notification_data_serializer = NotificationSerializer(notification)
        notification_dict[user_obj.id] = dict(notification_data_serializer.data)
        i -= 1

    return notification_dict

def get_recent_msg_data(user_id, dtype):
    
    user = User.objects.get(pk=user_id)
    chats = Chat.objects.all()
    recent_msg_data_dict = {}
    user_chats = []
    for chat_obj in chats:
        participants = list(chat_obj.participants.all().values_list('pk', flat=True))
        if user.id in participants:
            user_chats.append(chat_obj)

    recipient_user_id = None
    for chat_obj in user_chats:
        participants = chat_obj.participants.all()
        for p_obj in participants:
            if p_obj.id != user.id:
                recipient_user_id = p_obj.id
        recent_message = chat_obj.messages.order_by('-timestamp').all()[:1]
        if recent_message:
            recent_message = recent_message[0]
            recent_msg_data = message_to_json(recent_message, str(chat_obj.id))
            recent_msg_data['recipient_id'] = recipient_user_id
            recent_msg_data['last_seen'] = json.loads(chat_obj.last_seen)[str(user_id)] if (chat_obj.last_seen and str(user_id) in json.loads(chat_obj.last_seen)) else ''
            recent_msg_data_dict[str(chat_obj.id)] = recent_msg_data
    
    return recent_msg_data_dict

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
        'chatId': chat_id
    }


def get_rooms():
    return Room.objects.all()


def get_all_chats_data(user_id):

    all_chats = Chat.objects.all()
    user = User.objects.get(pk=user_id)
    chat_data = []

    user_chats = []
    for chat_obj in all_chats:
        participants = list(chat_obj.participants.all())
        if user in participants:
            user_chats.append(chat_obj)

    i = 0
    for chat in user_chats:
        temp = {}
        users = []
        participants = chat.participants.all()
        for participant in participants:
            if participant.id != user.id:
                recent_msg = chat.messages.order_by('-timestamp').all()[:1][0].content
                temp['curr_user'] = UserSerializer(participant).data
                usr_obj = {}
                usr_obj['id'] = i
                usr_obj['photo'] = temp['curr_user']['profile_picture']
                usr_obj['name'] = temp['curr_user']['username']
                usr_obj['user_id'] = temp['curr_user']['id']
                usr_obj['chat_id'] = chat.id
                usr_obj['last_seen'] = json.loads(chat.last_seen)[str(participant.id)] if (chat.last_seen and str(participant.id) in json.loads(chat.last_seen)) else ''
                usr_obj['text'] = recent_msg
                temp['chat'] = usr_obj
                temp['chat']['isFriend'] = ChatFriend.objects.are_friends(user, participant) == True
            users.append(participant)
        participants = UserSerializer(users, many=True).data
        temp['chat_id'] = chat.id
        temp['participants'] = participants
        chat_data.append(temp)
        i += 1
    
    return chat_data