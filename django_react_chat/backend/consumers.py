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
            'messages': {'messages': self.messages_to_json(message_data['chat_msgs'], data['chatId']),
                        'recent_msg_data': recent_msg_data},
            'chat_id': data['chatId']
        }
        self.send_message(content)

    def new_message(self, data):

        user = get_user(data['from'])
        message = Message.objects.create(
            user=user,
            content=data['message'])
        current_chat = get_current_chat(data['chatId'])
        current_chat.messages.add(message)
        current_chat.save()
        recent_msg_data = get_recent_msg_data(data['from'], "new")
        # self.new_message_signal.send(sender=Message, instance=message, created=True, recent_msg_data=recent_msg_data, chatId=data['chatId'], userId=data['from'], custom=True, f=self.fetch_chat_requests)
        content = {
            'command': 'new_message',
            'message': {'messages': self.message_to_json(message, data['chatId']), 
                        'recent_msg_data': recent_msg_data, 'user_id': data['from'] },
            'chat_id': data['chatId']
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

    def messages_to_json(self, messages, chat_id):
        result = []
        if messages:
            for message in messages:
                result.append(self.message_to_json(message, chat_id))
        return result

    def message_to_json(self, message, chat_id):
        return {
            'id': message.id,
            'author_id': message.user.id,
            'author': message.user.username,
            'content': message.content,
            'timestamp': str(message.timestamp),
            'chatId': chat_id
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
    

    def fetch_chat_requests(self, data):
        temp = {}
        temp['user_id'] = data['user_id']
        temp['chat_id'] = data['chat_id']
        temp['recipient_user_id'] = data['recipient_user_id']
        ip = [data['user_id'], data['recipient_user_id']]
        op_data = manage_chat_request_data(ip, data['action'], data['chat_id'], data['notification_data'])
        temp['chat_requests'] = json.dumps(op_data)
        temp['action'] = data['action']
        temp['notification_data'] = data['notification_data']
        temp['command'] = 'chat_requests'
        return self.send_response(temp)   

    def chat_status(self, data):

        temp = {}
        temp['chat_status'] = {'user_id': data.get('user_id', ''), 'status': data['status'], 'type': data['type']}
        temp['command'] = 'chat_status' 
        return self.send_response(temp)   

    def last_seen(self, data):
        temp_data = data['data']['last_seen']
        recipient_id = data['data']['user_id']
        chat_id = data['data']['chat_id']
        chat = Chat.objects.get(pk=chat_id)
        curr_last_seen = chat.last_seen
        
        last_seen_dict = {}
        if curr_last_seen:
            last_seen_dict = json.loads(curr_last_seen)
            last_seen_dict[str(temp_data['user_id'])] = temp_data['last_seen']
        else:
            last_seen_dict[str(temp_data['user_id'])] = temp_data['last_seen']
        chat.last_seen = json.dumps(last_seen_dict)
        chat.save()
        temp = {}
        temp['command'] = 'last_seen'
        temp['last_seen'] = {'user_id': temp_data.get('user_id', ''), 'last_seen': str(temp_data['last_seen']), 'chat_id': temp_data['chat_id'], 'recipient_id': recipient_id}
        return self.send_response(temp)   

    commands = {
        'fetch_messages': fetch_messages,
        'new_message': new_message,
        'fetch_friend_requests': fetch_friend_requests,
        'new_friend_request': new_friend_request,
        'fetch_chat_requests': fetch_chat_requests,
        'chat_status': chat_status,
        'last_seen': last_seen
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
                'chat_status': data.get('chat_status', {}),
                'last_seen': data.get('last_seen', {}),
            }
        )

    def send_message(self, data):
        self.send(text_data=json.dumps(data))

    def chat_message(self, event):
        message = event['message']
        self.send(text_data=json.dumps(message))
