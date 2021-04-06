import json
from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import permissions
from .serializers import UserSerializer, NotificationSerializer, RoomSerializer, ChatSerializer
from django.contrib.auth.hashers import check_password, make_password
from friendship.models import Friend, Follow, Block, FriendshipRequest
from .models import User, ChatFriend, ChatManager, ChatRequest, Chat, Notification, Room, Message
from django.core.cache import cache
from channels.db import database_sync_to_async
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from decouple import config
from django.utils import timezone
import datetime

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
            curr_user_data = user_data_dict[user.id]
            curr_user_data['friend_request_created_on'] = str(fr_obj.created)
            all_fr_requests.append(curr_user_data)

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
            curr_usr_obj = dict(user_obj)
            curr_usr_obj['chat_id'] = chat_id
            user_data_dict[user_obj['id']] = curr_usr_obj

        # Clear cache

        for key in list(cache._cache.keys()):
            if 'scfr' or 'cfr' in key:
                cache.delete(key.replace(':1:', ''))

        all_friends = ChatFriend.objects.chat_friends(recieved_user)

        all_frs = []
        friend_id_list = []
        p = []
        for friend_obj in all_friends:
            req_user = friend_obj.id
            friend_id_list.append(req_user)
            all_frs.append(user_data_dict[req_user])

        recent_msg_data_dict = get_recent_msg_data(user_id, "fetch")
        all_chats = Chat.objects.all()

        user_chats = []
        for chat_obj in all_chats:
            participants = list(chat_obj.participants.all().values_list('pk', flat=True))
            if user_id in participants:
                user_chats.append(chat_obj)

        last_seen_dict = {}
        chat_data = []
        i = 0
        for chat in user_chats:
            temp = {}
            users = []
            cleared_chat = json.loads(chat.cleared).get(str(user_id), False) if chat.cleared else False
            last_seen_dict[str(chat.id)] = json.loads(chat.last_seen) if chat.last_seen else {}
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
                    usr_obj['last_seen'] = json.loads(chat.last_seen) if chat.last_seen and not cleared_chat else {}
                    usr_obj['author_id'] = recent_msg_data_dict[str(chat.id)]['author_id'] if str(chat.id) in recent_msg_data_dict else ''
                    usr_obj['text'] = recent_msg_data_dict[str(chat.id)]['content'] if str(chat.id) in recent_msg_data_dict else ''
                    temp['chat'] = usr_obj
                    temp['chat_id'] = str(chat.id)
                    temp['is_deleted'] = json.loads(chat.deleted) if chat.deleted else {}
                    temp['chat']['isFriend'] = ChatFriend.objects.are_friends(recieved_user, participant) == True
                users.append(participant)
            participants = UserSerializer(users, many=True).data
            for p_obj in participants:
                p_obj['chat_id'] = str(chat.id)
                p.append(p_obj)
            temp['chat_id'] = str(chat.id)
            temp['is_deleted'] = json.loads(chat.deleted) if chat.deleted else {}
            temp['participants'] = p
            chat_data.append(temp)
            i += 1

        all_friend_requests = ChatFriend.objects.unrejected_requests(user=recieved_user)
    
        all_fr_requests = []
        friend_requests_id_list = []

        for fr_obj in all_friend_requests:
            user = fr_obj.from_user
            friend_requests_id_list.append(user.id)
            curr_user_data = user_data_dict[user.id]
            curr_user_data['chat_request_created_on'] = str(fr_obj.created)
            all_fr_requests.append(curr_user_data)

        all_sent_friend_requests = ChatFriend.objects.sent_requests(user=recieved_user)
        
        all_sent_fr_requests = []
        sent_friend_requests_id_list = []

        for sent_friend_req_obj in all_sent_friend_requests:
            user = sent_friend_req_obj.to_user
            sent_friend_requests_id_list.append(user.id)
            curr_user_data = user_data_dict[user.id]
            all_sent_fr_requests.append(curr_user_data)
        
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
        data = {'friends' :display_users, 'modal_chats':all_frs, 'chat_requests':all_fr_requests, 'sent_chat_requests':all_sent_fr_requests, 'data_dict': data_dict, 'reqd_chat_data': chat_data}
        curr_chat_data = {}
        for obj in chat_data:
            if obj['chat_id'] == chat_id:
                curr_chat_data = obj['chat']
        op_dict[user_id] = data
        op_dict[user_id]['action'] = action
        op_dict[user_id]['chat_id'] = chat_id
        op_dict[user_id]['curr_chat_data'] = curr_chat_data
        op_dict[user_id]['notification'] = notification_data[str(user_id)] if notification_data else None
        op_dict[user_id]['last_seen'] = last_seen_dict

    return op_dict

def get_user(user_id):

    return User.objects.get(pk=user_id)

def get_current_chat(chat_id):

    return Chat.objects.get(pk=chat_id)

def update_chat(data):
    chat_id = data['chatId']
    user_id = data['from']
    extra_data = data.get('extra_data', {})
    added_participants = []
    if extra_data:
        added_participants = extra_data.get('added_participants', [])
    current_chat = Chat.objects.get(pk=chat_id)
    participants = current_chat.participants.all()
    user = User.objects.get(pk=user_id)
    curr_deleted_chat = current_chat.deleted
    curr_clear_chat = current_chat.cleared
    curr_removed_dict = json.loads(current_chat.removed) if current_chat.removed else {}
    curr_exit_dict = json.loads(current_chat.has_exit) if current_chat.has_exit else {}
    clear_chat_dict = {}
    delete_chat_dict = {}
    p_list = []
    for p in participants:
        p_list.append(p.id)
    for obj in added_participants:
        if obj not in p_list:
            p_list.append(obj)
    if data['is_group']:
        message_list = []
        message = {}
        recent_message = {}
        recipients = data['to']
        if data['type'] == 'group_changes':
            content = data['message']['msg']
            for obj in content:
                message_obj = Message.objects.create(
                user=user,
                content=obj, message_type=data['type'], 
                cleared={}, 
                deleted={}, participants=json.dumps(p_list))
                current_chat.messages.add(message_obj)
                msg = message_to_json(message_obj, str(current_chat.id), user.id, current_chat.is_group)
                message_list.append(msg)
        elif data['type'] == 'text':
            content = data['message']['msg']
            message = Message.objects.create(
                user=user,
                content=content, message_type=data['type'], 
                cleared={}, 
                deleted={}, participants=json.dumps(p_list))
            current_chat.messages.add(message)
        else:
            content = json.dumps(data['message'])
            message = Message.objects.create(
                user=user,
                content=content, message_type=data['type'], 
                cleared={}, 
                deleted={}, participants=json.dumps(p_list))
            current_chat.messages.add(message)

        recent_message = {}

        chat_removed = json.loads(current_chat.removed).get(str(user.id), False) if current_chat.removed else False
        chat_has_exit = json.loads(current_chat.has_exit).get(str(user.id), False) if current_chat.has_exit else False
        
        if chat_removed:
            recent_msg = get_recent_msg_recursion(current_chat, user, 'removed')
        elif chat_has_exit:
            recent_msg = get_recent_msg_recursion(current_chat, user, 'has_exit')
        else:
            recent_msg = get_recent_msg_recursion(current_chat, user, '')

        if recent_msg:
            recent_message = message_to_json(recent_msg[0], str(current_chat.id), user.id, current_chat.is_group)

        current_chat.save()

        curr_chat_serializer = ChatSerializer(current_chat).data
        curr_chat_serializer["recent_message"] = recent_message
        
        return { 'message': message, 'current_chat': curr_chat_serializer,
        'message_list': message_list, 'removed_dict': curr_removed_dict, 
        'exit_dict': curr_exit_dict }

    else:
        recipient_user_id = data['to']
        recipient_user = User.objects.get(pk=recipient_user_id)
        content = ''    
        prev_delete_val = False
        prev_clear_val = False
        if curr_clear_chat:
            clear_chat_dict = json.loads(curr_clear_chat) if curr_clear_chat else {}
            prev_clear_val = clear_chat_dict[str(recipient_user_id)] if str(recipient_user_id) in clear_chat_dict else False
        if curr_deleted_chat:
            delete_chat_dict = json.loads(curr_deleted_chat) if curr_deleted_chat else {}
            prev_delete_val = delete_chat_dict[str(recipient_user_id)] if str(recipient_user_id) in delete_chat_dict else False
        if recipient_user_id in p_list:
            clear_chat_dict[str(recipient_user_id)] = False
            delete_chat_dict[str(recipient_user_id)] = False
        if data['type'] == 'text':
            content = data['message']['msg']
        else:
            content = json.dumps(data['message'])
        message = Message.objects.create(
            user=user,
            content=content, message_type=data['type'], 
            cleared={}, 
            deleted={})
        current_chat.cleared = json.dumps(clear_chat_dict)
        current_chat.deleted = json.dumps(delete_chat_dict)
        current_chat.messages.add(message)
        current_chat.save()

        recent_message = message_to_json(message, str(current_chat.id), recipient_user.id, current_chat.is_group)

        recipient_user_serializer = UserSerializer(user).data

        last_seen = get_last_seen(current_chat.last_seen, user.id)

        curr_chat_serializer = ChatSerializer(current_chat).data
        curr_chat_serializer["recent_message"] = recent_message
        curr_chat_serializer["last_seen"] = str(last_seen)
        curr_chat_serializer["user"] = recipient_user_serializer

        flags = { 'c_flag': prev_clear_val, 'd_flag': prev_delete_val }

        print(message)
        return { 'message': message, 'flags': flags, 'current_chat': curr_chat_serializer }


def get_recent_msg_recursion(current_chat, user, d_type):
    from datetime import datetime, timedelta

    recent_msg = [] 

    curr_removed_time = json.loads(current_chat.removed_time) if current_chat.removed_time else {}
    reqd_removed_time = curr_removed_time.get(str(user.id), '')

    curr_has_exit_time = json.loads(current_chat.has_exit_time) if current_chat.has_exit_time else {}
    reqd_has_exit_time = curr_has_exit_time.get(str(user.id), '')

    if d_type == 'removed':
        if reqd_removed_time:
            curr_removed_time_obj = datetime.strptime(reqd_removed_time, '%Y-%m-%d %H:%M:%S.%f')
            chat_msgs = current_chat.messages.order_by('-timestamp').filter(timestamp__lte=curr_removed_time_obj)
        else:
            chat_msgs = current_chat.messages.order_by('-timestamp').all()[:1]
    elif d_type == 'has_exit':
        if reqd_has_exit_time:
            curr_has_exit_time_obj = datetime.strptime(reqd_has_exit_time, '%Y-%m-%d %H:%M:%S.%f')
            chat_msgs = current_chat.messages.order_by('-timestamp').filter(timestamp__lte=curr_has_exit_time_obj)
        else:
            chat_msgs = current_chat.messages.order_by('-timestamp').all()[:1]
    else:
        chat_msgs = current_chat.messages.order_by('-timestamp').all()[:1]

    for obj in chat_msgs:
        is_removed = False
        is_exit = False
        if current_chat.is_group:
            msg_participants_list = json.loads(obj.participants) if obj.participants else []
        else:
            msg_participants_list = [user.id]
        removed_dict = json.loads(obj.removed) if obj.removed else {}
        has_exit_dict = json.loads(obj.has_exit) if obj.has_exit else {}
        if str(user.id) in removed_dict and removed_dict[str(user.id)]:
            is_removed = True
        if str(user.id) in has_exit_dict and has_exit_dict[str(user.id)]:
            has_exit = True
        if user.id in msg_participants_list and not is_removed and not is_exit:
            recent_msg.append(obj)
            break

    return recent_msg
    
def get_last_seen(last_seen_dict, user_id):

    last_seen_data = json.loads(last_seen_dict) if last_seen_dict else {}
    last_seen = ''
    for obj in last_seen_data:
        if obj != str(user_id):
            last_seen = last_seen_data[obj]
    return last_seen

def get_last_10_messages(chat_id, user_id):
    from datetime import datetime, timedelta

    recipient_user_id = ''
    chat = Chat.objects.get(pk=chat_id)

    chat_cleared = json.loads(chat.cleared).get(str(user_id), False) if chat.cleared else False
    chat_deleted = json.loads(chat.deleted).get(str(user_id), False) if chat.deleted else False
    chat_removed = json.loads(chat.removed).get(str(user_id), False) if chat.removed else False
    chat_has_exit = json.loads(chat.has_exit).get(str(user_id), False) if chat.has_exit else False
    
    msgs = []
    chat_msgs = []
    updated_msgs = []

    curr_added_time = json.loads(chat.added_time) if chat.added_time else {}
    reqd_added_time = curr_added_time.get(str(user_id), None)

    curr_removed_time = json.loads(chat.removed_time) if chat.removed_time else {}
    reqd_removed_time = curr_removed_time.get(str(user_id), None)

    curr_has_exit_time = json.loads(chat.has_exit_time) if chat.has_exit_time else {}
    reqd_has_exit_time = curr_has_exit_time.get(str(user_id), None)

    if not chat_deleted:
        if chat_removed:
            if reqd_removed_time:
                curr_removed_time_obj = datetime.strptime(reqd_removed_time, '%Y-%m-%d %H:%M:%S.%f')
                chat_msgs = chat.messages.order_by('-timestamp').filter(timestamp__lte=curr_removed_time_obj)[:10]
            else:
                chat_msgs = chat.messages.order_by('-timestamp').all()[:10]
        elif chat_has_exit:
            if reqd_has_exit_time:
                curr_has_exit_time_obj = datetime.strptime(reqd_has_exit_time, '%Y-%m-%d %H:%M:%S.%f')
                chat_msgs = chat.messages.order_by('-timestamp').filter(timestamp__lte=curr_has_exit_time_obj)[:10]
            else:
                chat_msgs = chat.messages.order_by('-timestamp').all()[:10]
        else:
            # 0.5s difference to get the add msg in all msgs.
            if chat.is_group:
                req_time_diff = timedelta(0, 0.5)
                if reqd_added_time:
                    reqd_added_time_obj = datetime.strptime(reqd_added_time, '%Y-%m-%d %H:%M:%S.%f')
                    reqd_time = reqd_added_time_obj - req_time_diff
                    chat_msgs = chat.messages.order_by('-timestamp').filter(timestamp__gte=reqd_time)[:10]
                else:
                    chat_msgs = chat.messages.order_by('-timestamp').all()[:10]
            else:
                chat_msgs = chat.messages.order_by('-timestamp').all()[:10]
        for obj in chat_msgs:
            is_removed = False
            has_exit = False
            if chat.is_group:
                msg_participants_list = json.loads(obj.participants) if obj.participants else []
            else:
                msg_participants_list = [user_id]
            removed_dict = json.loads(obj.removed) if obj.removed else {}
            has_exit_dict = json.loads(obj.has_exit) if obj.has_exit else {}
            if str(user_id) in removed_dict and removed_dict[str(user_id)]:
                is_removed = True
            if str(user_id) in has_exit_dict and has_exit_dict[str(user_id)]:
                has_exit = True
            if user_id in msg_participants_list:
                updated_msgs.append(obj)
            # if user_id in msg_participants_list and not is_removed and not has_exit:
            #     updated_msgs.append(obj)

        for chat_msg in updated_msgs:
            cleared_msg = json.loads(chat_msg.cleared).get(str(user_id), False) 
            deleted_msg = json.loads(chat_msg.deleted).get(str(user_id), False)
            if not cleared_msg and not deleted_msg:
                msgs.append(chat_msg)
    
    # msgs = chat.messages.order_by('-timestamp').all()[:10]

    return {'chat_msgs': msgs, 'recent_msg_data': {}, 'chat': chat}


def get_all_notifications(user_id):
    
    user = User.objects.get(pk=user_id)
    notifications = user.notifications.order_by('-created_on').all()[:10]

    notification_serializer = NotificationSerializer(notifications, many=True)

    return notification_serializer.data


def manage_notifications(user, recipient_user, notification_type):

    users = [user, recipient_user]
    notification_dict = {}
    i = 1
    message = ''
    if notification_type == 'conversations':
        message += 'You can now chat with '
    elif notification_type == 'friend_requests':
        message += 'You have a new friend request from '
    elif notification_type == 'conversation_requests':
        message += 'You have a new conversation request from '
    elif notification_type == 'friends':
        message += 'You are now friends with '

    if notification_type == 'friend_requests' or notification_type == 'conversation_requests':
        notification = Notification.objects.create(
                friend = recipient_user.id,
                message = message + user.username,
                participants = [user.id, recipient_user.id],
                notification_type = notification_type
            )
        current_user = User.objects.get(pk=recipient_user.id)
        current_user.notifications.add(notification)
        current_user.save()
        notification_data_serializer = NotificationSerializer(notification)
        notification_dict[recipient_user.id] = dict(notification_data_serializer.data)
    else:
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

    recent_message = {}
    recipient_user_id = None
    for chat_obj in user_chats:
        cleared_chat = json.loads(chat_obj.cleared).get(str(user_id), False) if chat_obj.cleared else False
        participants = chat_obj.participants.all()
        for p_obj in participants:
            if p_obj.id != user.id:
                recipient_user_id = p_obj.id
        if not cleared_chat:
            recent_message = chat_obj.messages.order_by('-timestamp').all()[:1]
        if recent_message:
            recent_message = recent_message[0]
            recent_msg_data = message_to_json(recent_message, str(chat_obj.id), '', chat_obj.is_group)
            is_text = False
            is_image = False
            is_audio = False
            if recent_msg_data != '':
                if recent_msg_data['message_type'] == 'image':
                    is_image = True
                elif recent_msg_data['message_type'] == 'text':
                    is_text = True
                elif recent_msg_data['message_type'] == 'audio':
                    is_audio = True
            if is_image:
                recent_msg_data['content'] = 'Image'
            elif is_audio:
                recent_msg_data['content'] = 'Audio'
            recent_msg_data['recipient_id'] = recipient_user_id
            recent_msg_data['message_type'] = recent_message.message_type
            recent_msg_data['last_seen'] = json.loads(chat_obj.last_seen) if chat_obj.last_seen else {}
            recent_msg_data['is_deleted'] = json.loads(chat_obj.deleted) if chat_obj.deleted else {}
            recent_msg_data_dict[str(chat_obj.id)] = recent_msg_data
    
    return recent_msg_data_dict

def messages_to_json(messages, chat_id, is_group):
        result = []
        if messages:
            for message in messages:
                result.append(message_to_json(message, chat_id, '', is_group))
        return result


def message_to_json(message, chat_id, user_id, is_group):
    content = ''
    if message.message_type == 'text':
        if is_group:
            if message.user.id == user_id:
                content = "You: " + message.content
            else:
                content = message.user.username + ": " + message.content
        else:
            if message.user.id == user_id:
                content = "You: " + message.content
            else:
                content = message.content
    elif message.message_type == 'group_changes':
        if message.user.id == user_id:
            content = message.content
        else:
            if "You have" in message.content:
                content = message.content.replace("You have ", message.user.username+ " has ")
            else:
                content = message.content.replace("You", message.user.username)
    elif message.message_type == 'image':
        if is_group:
            if message.user.id == user_id:
                content = "You: Image"
            else:
                content = message.user.username + ": Image"
        else:
            if message.user.id == user_id:
                content = "You: Image"
            else:
                content = "Image"
                
    return {
        'id': message.id,
        'author_id': message.user.id,
        'author': message.user.username,
        'content': content,
        'timestamp': str(message.timestamp),
        'chatId': chat_id,
        'reciever': message.reciever,
        'message_type': message.message_type,
        'is_group': is_group
    }


def get_rooms():
    return Room.objects.all()


def get_all_chats_data(user_id):

    all_chats = Chat.objects.all()
    user = User.objects.get(pk=user_id)
    chat_data = []
    res = {}
    user_chats = []
    for chat_obj in all_chats:
        participants = list(chat_obj.participants.all())
        if user in participants:
            user_chats.append(chat_obj)
    
    i = 0
    last_seen_dict = {}
    p = []
    for chat in user_chats:
        cleared_chat = json.loads(chat.cleared).get(str(user_id), False) if chat.cleared else False
        last_seen_dict[str(chat.id)] = json.loads(chat.last_seen) if chat.last_seen and not cleared_chat else {}
        temp = {}
        users = []
        participants = chat.participants.all()
        p = UserSerializer
        for participant in participants:
            if participant.id != user.id:
                c_messages = chat.messages.order_by('-timestamp').all()
                messages = []
                for chat_msg in c_messages:
                    cleared_msg = json.loads(chat_msg.cleared).get(str(participant.id), False)
                    deleted_msg = json.loads(chat_msg.deleted).get(str(participant.id), False)
                    if not cleared_msg and not deleted_msg:
                        messages.append(chat_msg)
                curr_msg = message_to_json(messages[:1][0], str(chat.id), '', chat.is_group) if len(list(messages)) > 0 else ''
                author_id = curr_msg['author_id'] if curr_msg else ''
                is_text = False
                is_image = False
                is_audio = False
                if curr_msg != '':
                    if curr_msg['message_type'] == 'image':
                        is_image = True
                    elif curr_msg['message_type'] == 'text':
                        is_text = True
                    elif curr_msg['message_type'] == 'audio':
                        is_audio = True
                recent_msg = messages[:1][0].content if len(list(messages)) > 0 else ''
                temp['curr_user'] = UserSerializer(participant).data
                usr_obj = {}
                usr_obj['id'] = i
                usr_obj['photo'] = temp['curr_user']['profile_picture']
                usr_obj['name'] = temp['curr_user']['username']
                usr_obj['user_id'] = temp['curr_user']['id']
                usr_obj['chat_id'] = str(chat.id)
                usr_obj['author_id'] = author_id
                usr_obj['is_deleted'] = json.loads(chat.deleted) if chat.deleted else {}
                usr_obj['last_seen'] = json.loads(chat.last_seen) if chat.last_seen and not cleared_chat else {}
                if is_image:
                    usr_obj['text'] = 'Image'
                elif is_audio:
                    usr_obj['text'] = 'Audio'
                else:
                    usr_obj['text'] = recent_msg
                temp['chat'] = usr_obj
                temp['chat']['isFriend'] = ChatFriend.objects.are_friends(user, participant) == True
                temp['chat_id'] = str(chat.id)
            users.append(participant)
        # participants = UserSerializer(users, many=True).data
        # for p_obj in participants:
        #     p_obj['chat_id'] = str(chat.id)
        #     p.append(p_obj)
        temp['chat_id'] = str(chat.id)
        temp['participants'] = []
        temp['is_deleted'] = json.loads(chat.deleted) if chat.deleted else {}
        chat_data.append(temp)
        i += 1
    
    res['last_seen'] = last_seen_dict
    res['chat_data'] = chat_data
    return res

def get_last_seen_data(users):

    all_chats = Chat.objects.all()
    last_seen = {}
    for user_id in users:

        user = User.objects.get(pk=user_id)
        chat_data = []

        user_chats = []
        for chat_obj in all_chats:
            participants = list(chat_obj.participants.all())
            if user in participants:
                user_chats.append(chat_obj)
        
        last_seen_dict = {}
        for chat in user_chats:
            cleared_chat = json.loads(chat.cleared).get(str(user_id), False) if chat.cleared else False
            last_seen_dict[str(chat.id)] = json.loads(chat.last_seen) if chat.last_seen and not cleared_chat else {}

        last_seen[str(user_id)] = last_seen_dict

    return last_seen

def create_presigned_url(bucket_name, bucket_key):
    
    s3_client = boto3.client('s3')
    try:
        response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': bucket_name,
                                                            'Key': bucket_key},
                                                    ExpiresIn=604800)

    except ClientError as e:
        logging.error(e)
        return None

    return response

def get_presigned_url(file_name):

    s3_signature_dict ={
    'v4':'s3v4',
    'v2':'s3'
    }
    s3_signature = s3_signature_dict['v2']
    weeks = 8
    seven_days_as_seconds = 604800
    generated_signed_url = create_presigned_url(config('AWS_STORAGE_BUCKET_NAME'), file_name)
    return generated_signed_url

def get_conversation_requests(recieved_user, extra_data):

    user_data_dict = dict()

    all_usrs = User.objects.all()
    usr_serializer = UserSerializer(all_usrs, many=True)

    for user_obj in usr_serializer.data:
        user_data_dict[user_obj['id']] = dict(user_obj)

    group_data_dict = {}
    recipient_list = []
    if extra_data['is_group']:
        group_user_dict = {}
        for recieved_user_obj in recieved_user:
            recipient_list.append(recieved_user_obj['id'])
            curr_user = User.objects.get(pk=recieved_user_obj['id'])
            conversation_data = get_all_conversations(curr_user, extra_data["action"], extra_data['is_group'], extra_data['group_data'])
            all_conversations = conversation_data['conversations']
            all_groups = conversation_data['groups']
            all_conv_data = all_conversations + all_groups
            group_data_dict[str(recieved_user_obj['id'])] = {'all_conv_data': all_conv_data, 'all_groups': all_groups, 'all_conversations': all_conversations} 
                        
        return {'group_data_dict': group_data_dict, 'sender': extra_data['sender'], 'group_data': extra_data['group_data'], 'is_group': extra_data['is_group'], 'action': extra_data['action'], 'type': extra_data['type'], 'recipients': recipient_list, 'user_id': extra_data['user_id']}
    
    else:

        # SENT CONVERSATION REQUESTS
        
        all_sent_friend_requests = ChatFriend.objects.sent_requests(user=recieved_user)

        all_sent_fr_requests = []
        sent_friend_requests_id_list = []

        conversation_data = get_all_conversations(recieved_user, extra_data["action"], extra_data['is_group'], {})
        all_conversations = conversation_data['conversations']
        all_groups = conversation_data['groups']
        all_conv_data = all_conversations + all_groups

        conversation_delete_dict = {}
        remove_dict = {}
        delete_dict = {}
        clear_dict = {}

        for conv in all_conversations:
            recipient_user = User.objects.get(pk=conv['user']['id'])
            remove_dict[recipient_user.id] = ChatFriend.objects.are_friends(recieved_user, recipient_user) == True
        
        conversation_delete_dict['remove'] = remove_dict

        for sent_friend_req_obj in all_sent_friend_requests:
            user = sent_friend_req_obj.to_user
            sent_friend_requests_id_list.append(user.id)
            all_sent_fr_requests.append(user_data_dict[user.id])

        # CONVERSATIONS
        chat_friends = ChatFriend.objects.chat_friends(recieved_user)

        all_chat_frs = []
        chat_friend_id_list = []

        for chat_friend_obj in chat_friends:
            req_user = chat_friend_obj.id
            chat_friend_id_list.append(req_user)
            curr_user = user_data_dict[req_user]
            if extra_data["action"] == "accept":
                curr_user["chat_id"] = extra_data["chat_id"]
            all_chat_frs.append(curr_user)

        # FRIENDS
        all_friends = Friend.objects.friends(recieved_user)

        all_frs = []
        friend_id_list = []

        for friend_obj in all_friends:
            req_user = friend_obj.id
            friend_id_list.append(req_user)
            curr_user = user_data_dict[req_user]
            if req_user in sent_friend_requests_id_list:
                curr_user['sent_conversation_request'] = True
            elif extra_data['action'] == 'reject':
                curr_user['sent_conversation_request'] = False
            if req_user in chat_friend_id_list:
                curr_user['has_conversation'] = True
            all_frs.append(curr_user)

        # Clear cache

        for key in list(cache._cache.keys()):
            if 'scfr' or 'cfr' in key:
                cache.delete(key.replace(':1:', ''))

        all_friend_requests = ChatFriend.objects.unrejected_requests(user=recieved_user)

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
        
        curr_user_data = User.objects.get(pk=recieved_user.id)

        modal_data = {'user_data_dict': user_data_dict, 'all_conv_data': all_conv_data, 'last_seen_conversation_requests': str(curr_user_data.chat_request_last_seen), 'modal_groups':all_groups, 'all_conversations': all_conversations,'modal_friends': all_frs, 'modal_conversations': all_chat_frs, 'modal_conversation_requests': all_fr_requests, 'modal_sent_conversation_requests': all_sent_fr_requests}
        return {'sender': extra_data['sender'], 'recipient_user_id': recieved_user.id, 'user_id': extra_data['user_id'], 'modal_data': modal_data, 'type': extra_data, 'action': extra_data['action'], 'chat_id': extra_data['chat_id'], 'conversation_delete_dict': json.dumps(conversation_delete_dict)}

def get_all_conversations(user, action, is_group, group_data):

    all_chats = Chat.objects.all()
    removed_p_list = []
    added_p_list = []
    conversations = []
    groups = []
    
    recipient_user = {}
    if is_group and action == "update" and group_data['participant_change']:
        removed_p_list = group_data['removed_participants']
        added_p_list = group_data['added_participants']
    
    group_participants = group_data['participants']
    for chat in all_chats:
        if chat.is_group:
            if action != "update":
                removed_users_dict = json.loads(chat.removed) if chat.removed else {}
                for obj in removed_users_dict:
                    if removed_users_dict[obj]:
                        removed_p_list.append(int(obj))
            p_detail_list = []
            participant_list = list(chat.participants.values_list('id', flat=True))
            if user.id in removed_p_list or user.id in participant_list:
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

    return {'conversations': conversations, 'groups': groups}

def set_last_seen(data):
    
    chat_id = data.get('chat_id', '')
    user_id = data.get('user_id', '')
    last_seen = data.get('last_seen', '')

    chat = Chat.objects.get(pk=chat_id)
    curr_last_seen = chat.last_seen
    last_seen_dict = {}

    if curr_last_seen:
        last_seen_dict = json.loads(curr_last_seen)

    last_seen_dict[str(user_id)] = last_seen
    chat.last_seen = json.dumps(last_seen_dict)
    chat.save()

def exit_user_method(group_data):

    post_data = group_data
    req_chat_id = post_data['id']
    curr_group = Chat.objects.get(pk=req_chat_id)
    curr_user_id = post_data['curr_user_id']
    curr_exit_dict = curr_group.exit if curr_group.exit else {}
    curr_has_exit_dict = curr_group.has_exit if curr_group.has_exit else {}
    curr_has_exit_time_dict = curr_group.has_exit_time if curr_group.has_exit_time else {}
    curr_group_admins = json.loads(curr_group.admin) if curr_group.admin else []
    updated_admins = []
    exit_dict = {}
    has_exit_dict = {}
    has_exit_time_dict = {}

    for admin in curr_group_admins:
        if admin != curr_user_id:
            updated_admins.append(admin)

    if curr_exit_dict:
        exit_dict = json.loads(curr_exit_dict)
    exit_dict[str(curr_user_id)] = True

    if curr_has_exit_dict:
        has_exit_dict = json.loads(curr_has_exit_dict)
    has_exit_dict[str(curr_user_id)] = True
    
    if curr_has_exit_time_dict:
        has_exit_time_dict = json.loads(curr_has_exit_time_dict)
    has_exit_time_dict[str(curr_user_id)] = str(datetime.datetime.now())

    for participant in curr_group.participants.all():
        if participant.id == curr_user_id:
            curr_group.participants.remove(participant)

    participants = list(curr_group.participants.all())

    if len(updated_admins) == 0:
        updated_admins.append(participants[0].id)
    
    curr_group.exit = json.dumps(exit_dict)
    curr_group.has_exit = json.dumps(has_exit_dict)
    curr_group.has_exit_time = json.dumps(has_exit_time_dict)
    curr_group.admin = json.dumps(updated_admins)
    exit_msgs_dict = {}
    exit_msgs_dict[str(curr_user_id)] = True
    curr_group.messages.all().update(has_exit=json.dumps(exit_msgs_dict))
    curr_group.save()