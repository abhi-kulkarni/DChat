from backend.models import User
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import json
from .socket_views import *

class Consumer(WebsocketConsumer):

    def fetch_messages(self, data):
        messages = get_last_10_messages(data['chatId'])
        content = {
            'command': 'messages',
            'messages': self.messages_to_json(messages, data['chatId']),
            'chatId': data['chatId']
        }
        self.send_message(content)

    def new_message(self, data):
        user_contact = get_user(data['from'])
        message = Message.objects.create(
            user=user_contact,
            content=data['message'])
        current_chat = get_current_chat(data['chatId'])
        current_chat.messages.add(message)
        current_chat.save()
        content = {
            'command': 'new_message',
            'message': self.message_to_json(message, data['chatId']),
            'chatId': data['chatId']
        }
        return self.send_chat_message(content)

    def messages_to_json(self, messages, chat_id):
        result = []
        if messages:
            for message in messages:
                result.append(self.message_to_json(message, chat_id))
        return result

    def message_to_json(self, message, chat_id):
        return {
            'id': message.id,
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
        op_data = manage_friend_request_data(ip, data['action'])
        temp['friend_requests'] = json.dumps(op_data)
        temp['action'] = data['action']
        temp['command'] = 'friend_requests'
        return self.send_response(temp)    
    

    def new_friend_request(self, data):
        temp = {}
        friend_requests = get_all_friend_requests(data['user_id'])
        temp['friend_requests'] = friend_requests
        temp['user_id'] = data['user_id']
        temp['command'] = 'friend_requests'
        return self.send_response(temp)

    commands = {
        'fetch_messages': fetch_messages,
        'new_message': new_message,
        'fetch_friend_requests': fetch_friend_requests,
        'new_friend_request': new_friend_request,
    }

    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name
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
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

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
                'action': data.get('action', '')
            }
        )

    def send_message(self, data):
        self.send(text_data=json.dumps(data))

    def chat_message(self, event):
        message = event['message']
        self.send(text_data=json.dumps(message))
