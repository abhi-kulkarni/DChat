from backend.models import User, Message, Chat, Room
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import json
from .socket_views import *
from django.db.models import signals
from django.dispatch import receiver, Signal
import redis
from backend.serializers import RoomSerializer
import asyncio

class Consumer(WebsocketConsumer):

    new_message_signal = Signal()
    joined_rooms = None
    rooms = get_rooms()

    def fetch_messages(self, data): 
        message_data = get_last_10_messages(data['chatId'], data['userId'])
        recent_msg_data = get_recent_msg_data(data['userId'], "fetch")
        content = {
            'command': 'messages',
            'messages': {'messages': self.messages_to_json(message_data['chat_msgs'], data['chatId'], "fetch"),
                        'recent_msg_data': recent_msg_data},
            'chat_id': data['chatId']
        }
        self.send_message(content)

    def new_message(self, data):

        user = get_user(data['from'])
        content = ''
        if data['type'] == 'text':
            content = data['message']['msg']
        else:
            content = json.dumps(data['message'])
        
        current_chat = get_current_chat(data['chatId'])
        delete_flag = False
        participants = current_chat.participants.all()
        p_list = []
        extra_data = {}
        for p in participants:
            p_list.append(p.id)        
        curr_deleted_chat = current_chat.deleted
        curr_clear_chat = current_chat.cleared
        clear_chat_dict = {}
        delete_chat_dict = {}
        if curr_clear_chat:
            clear_chat_dict = json.loads(curr_clear_chat)
        if curr_deleted_chat:
            delete_chat_dict = json.loads(curr_deleted_chat)
        if user.id in p_list:
            clear_chat_dict[str(user.id)] = False
            delete_chat_dict[str(user.id)] = False

        extra_data = {'delete_chat_dict': delete_chat_dict, 'clear_chat_dict': clear_chat_dict}
        current_chat.cleared = json.dumps(clear_chat_dict)
        current_chat.deleted = json.dumps(delete_chat_dict)
        message = Message.objects.create(
            user=user,
            content=content, message_type=data['type'], cleared=json.dumps(clear_chat_dict), deleted=json.dumps(delete_chat_dict))
        
        current_chat.messages.add(message)
        current_chat.save()
        recent_msg_data = get_recent_msg_data(data['from'], "new")
        # self.new_message_signal.send(sender=Message, instance=message, created=True, recent_msg_data=recent_msg_data, chatId=data['chatId'], userId=data['from'], custom=True, f=self.fetch_chat_requests)
        content = {
            'command': 'new_message',
            'message': {'messages': self.message_to_json(message, data['chatId'], "new", extra_data), 
                        'recent_msg_data': recent_msg_data, 'user_id': data['from'] },
            'chat_id': data['chatId'],
            'delete_flag':delete_flag
        }

        return self.send_chat_message(content)
    
    # Any Signal Triggers
    @receiver(new_message_signal, sender=Message)
    def create_message(sender, instance, created, **kwargs):
        if created and kwargs['custom']:
            recipient_user_id = None
            chat_id = kwargs['chatId']
            user_id = kwargs['userId']
            recent_msg_data = kwargs['recent_msg_data']
            chat = Chat.objects.get(pk=chat_id)
            participants = chat.participants.all()
            for participant in participants:
                if participant.id != user_id:
                    recipient_user_id = participant.id
            if recipient_user_id:
                kwargs['f']({'recent_msg_data':recent_msg_data, 'chat_id': chat_id, 'user_id': user_id, 'recipient_user_id': recipient_user_id, 'custom': True})
        else:
            print('DEFAULT SAVE MESSAGE')
        
    def messages_to_json(self, messages, chat_id, m_type):
        result = []
        extra_data = {}
        if messages:
            for message in messages:
                result.append(self.message_to_json(message, chat_id, m_type, extra_data))
        return result

    def message_to_json(self, message, chat_id, m_type, extra_data):
        return {
            'id': message.id,
            'author_id': message.user.id,
            'author': message.user.username,
            'content': message.content,
            'timestamp': str(message.timestamp),
            'chatId': chat_id,
            'type': m_type,
            'extra_data': extra_data,
            'message_type': message.message_type
        }
    
    def fetch_friend_requests(self, data):
        temp = {}
        temp['user_id'] = data['user_id']
        temp['recipient_user_id'] = data['recipient_user_id']
        ip = [data['user_id'], data['recipient_user_id']]
        op_data = manage_friend_request_data(ip, data['action'], data['notification_data'])
        temp['friend_requests'] = json.dumps(op_data)
        temp['action'] = data['action']
        temp['notification_data'] = data['notification_data']
        temp['command'] = 'friend_requests'
        return self.send_response(temp)    
    

    def new_friend_request(self, data):
        temp = {}
        friend_requests = get_all_friend_requests(data['user_id'])
        temp['friend_requests'] = friend_requests
        temp['user_id'] = data['user_id']
        temp['command'] = 'friend_requests'
        return self.send_response(temp)
    

    def fetch_conversation_requests(self, data):
        temp = {}
        user = None
        extra_data = {"sender": data.get("sender", ''), "group_data": data.get('group_data', {}), "is_group": data.get('is_group', False), "action": data.get('action', ''), "chat_id": data.get('chat_id', ''), "type": data.get('type', ''), "user_id": data.get('user_id', '')}
        if 'is_group' in data and data['is_group']:
            temp['recipients'] = data['recipient_user_id']
            temp['conversation_modal_data'] = get_conversation_requests(temp['recipients'], extra_data)
        else:
            user = User.objects.get(pk=data["recipient_user_id"])
            temp['conversation_modal_data'] = get_conversation_requests(user, extra_data)
            temp['recipient_user_id'] = data['recipient_user_id']
        temp['user_id'] = data['user_id']
        temp['command'] = 'conversation_requests'
        temp['is_group'] = data.get('is_group', False)
        temp['action'] = data.get('action', {})
        temp['sender'] = data.get('sender', '')
        temp['group_data'] = data.get('group_data', {})
        return self.send_response(temp)  
    
    def fetch_friend_requests1(self, data):
        temp = {}
        temp['command'] = 'friend_requests'
        temp['friends_modal_data'] = {
        'user_id': data['user_id'], 
        'request_source': data.get('request_source', ''),
        'action': data.get('action', ''), 
        'notification_data': data.get('notification_data', '')
        }
        return self.send_response(temp) 

    def fetch_socket_data(self, data):
        temp = {}
        temp['command'] = 'socket_data'
        temp['socket_data'] = {
            'user_id': data.get('user_id', ''),
            'msg': 'HELLO'
        }
        return self.send_response(temp)  

    def fetch_conversation_requests1(self, data):
        temp = {}
        temp['command'] = 'conversation_requests'
        temp['conversation_modal_data'] = {
        'user_id': data['user_id'], 
        'request_source': data.get('request_source', ''),
        'group_data': data.get('group_data', {}), 
        'action': data.get('action', ''), 
        'is_group': data.get('is_group', ''),
        'notification_data': data.get('notification_data', '')
        }
        return self.send_response(temp)  

    def fetch_chat_requests(self, data):
        temp = {} 
        chat_id = data.get('chat_id', '')
        notification_data = data.get('notification_data', {})
        temp['user_id'] = data['user_id']
        temp['chat_id'] = chat_id
        temp['recipient_user_id'] = data['recipient_user_id']
        ip = [data['user_id'], data['recipient_user_id']]
        op_data = manage_chat_request_data(ip, data['action'], chat_id, notification_data)
        temp['chat_requests'] = json.dumps(op_data)
        temp['action'] = data['action']
        temp['notification_data'] = notification_data
        temp['command'] = 'chat_requests'
        return self.send_response(temp)   

    def conversation_status(self, data):
        temp = {}
        temp['conversation_status'] = {'user_id': data.get('user_id', ''), 'status': data['status'], 'type': data['type']}
        temp['command'] = 'conversation_status' 
        return self.send_response(temp)  

    def is_typing(self, data):

        temp = {}
        temp['is_typing'] = {'user_id': data.get('user_id', ''), 'status': data['status'], 'type': data.get('type', ''), 'chat_id': data['chat_id']}
        temp['command'] = 'is_typing' 

        return self.custom_response(temp, 'is_typing')

    def last_seen(self, data):
        
        temp = {}
        chat_id = data['data']['chat_id']
        user_id = data['data']['user_id']
        recipient_user_id = data['data']['recipient_id']
        last_seen = data['data']['last_seen']
        chat = Chat.objects.get(pk=chat_id)
        participants = chat.participants.all()
        p_list = []
        for p in participants:
            p_list.append(p.id)        
        users = [user_id, recipient_user_id]
        curr_last_seen = chat.last_seen
        last_seen_dict = {}
        if curr_last_seen:
            last_seen_dict = json.loads(curr_last_seen)
        if user_id in p_list:
            last_seen_dict[str(user_id)] = last_seen
        chat.last_seen = json.dumps(last_seen_dict)
        chat.save()
        
        last_seen_data = get_last_seen_data(users)
        temp['command'] = 'last_seen'
        temp['last_seen'] = {'user_id': user_id, 'last_seen': last_seen, 'chat_id': str(chat_id), 'last_seen_data': last_seen_data}
        
        return self.custom_response(temp, 'last_seen')   
    

    def custom_response(self, data, r_type):

        room_1 = 'chat_'+data[r_type]['chat_id']
        room_2 = 'chat_chat_requests'
        rooms = [room_1, room_2]
        i = 0
        for room_obj in rooms:
            async_to_sync(self.channel_layer.group_send)(
                            room_obj,
                            {
                                'type': 'send_message',
                                r_type: data[r_type],
                                'command': r_type
                            }
                        )
            i += 1

    commands = {
        'fetch_messages': fetch_messages,
        'new_message': new_message,
        'fetch_friend_requests': fetch_friend_requests1,
        'new_friend_request': new_friend_request,
        'fetch_chat_requests': fetch_chat_requests,
        'fetch_conversation_requests':fetch_conversation_requests1,
        'fetch_socket_data': fetch_socket_data,
        'conversation_status': conversation_status,
        'last_seen': last_seen,
        'is_typing': is_typing,
    }

    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name
        try:
            room, created = Room.objects.get_or_create(room_group_name=self.room_group_name,
                                    channel_name=self.channel_name)
            room_serializer = RoomSerializer(room)
        except: 
            pass
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        data = json.loads(text_data)
        self.commands[data['command']](self, data)

    def send_chat_message(self, message): 
        print('-----------------------')
        room_1 = 'chat_'+message['chat_id']
        room_2 = 'chat_chat_requests'
        rooms = [room_1, room_2]
        i = 0
        for room_obj in rooms:
            if i == 1:
                message['command'] = "recent_msg"
                message['message']['custom'] = True   
            async_to_sync(self.channel_layer.group_send)(
                            room_obj,
                            {
                                'type': 'chat_message',
                                'message': message
                            }
                        )
            i += 1

    def send_response(self, data):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'send_message',
                'chat_requests': data.get('chat_requests', ''),
                'friend_requests': data.get('friend_requests', ''),
                'chat_request_status': data.get('chat_request_status', ''),
                'user_id': data.get('user_id', ''),
                'friend_request_status': data.get('status_change', ''),
                'command': data.get('command', ''),
                'online_users': data.get('online_users', ''),
                'recipient_user_id': data.get('recipient_user_id', ''),
                'action': data.get('action', ''),
                'chat_requests': data.get('chat_requests', ''),
                'chat_id': data.get('chat_id', ''),
                'messages': data.get('messages', []),
                'notification_data': data.get('notification_data', {}),
                'conversation_status': data.get('conversation_status', {}),
                'last_seen': data.get('last_seen', {}),
                'is_typing': data.get('is_typing', {}),
                'is_group': data.get('is_group', False),
                'recipients': data.get('recipients', []),
                'group_data': data.get('group_data', {}),
                'sender': data.get('sender', {}),
                'conversation_modal_data': data.get('conversation_modal_data', {}),
                'friends_modal_data': data.get('friends_modal_data', {}),
                'socket_data':data.get('socket_data', {})
            }
        )

    def send_message(self, data):
        self.send(text_data=json.dumps(data))

    def chat_message(self, event):
        message = event['message']
        self.send(text_data=json.dumps(message))
