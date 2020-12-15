import json
from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import permissions
from .serializers import UserSerializer
from django.contrib.auth.hashers import check_password, make_password
from friendship.models import Friend, Follow, Block, FriendshipRequest
from .models import User
from django.core.cache import cache

def manage_friend_request_data(ip, action):
    
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
    return op_dict