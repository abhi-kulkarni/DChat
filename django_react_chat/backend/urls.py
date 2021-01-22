from django.urls import path
from django.conf.urls import url
from .views import *
from rest_framework_simplejwt import views as jwt_views

urlpatterns = [
    path('signout/', signout),
    path('signup/', signup),
    path('is_authenticated/', is_authenticated),
    path('get_all_users/', get_all_users),
    path('get_all_friends/', get_all_friends),
    path('get_curr_user/', get_curr_user),
    path('update_user/<pk>/', update_user),
    path('delete_user/<pk>/', delete_user),
    path('change_password/', change_password),
    path('validate_email/', validate_email),
    path('validate_password/', validate_password),
    path('manage_friends/', manage_friends),
    path('manage_chats/', manage_chats),
    path('get_manage_friends_data/', get_manage_friends_data),
    path('get_chat/<pk>/', get_chat),
    path('get_all_chats/', get_all_chats),
    path('get_all_notifications/', get_all_notifications),
    path('manage_notifications/', manage_notifications),
    path('get_recent_msg_data/', get_recent_msg_data),
    path('set_last_seen/', set_last_seen),
    path('upload_chat_image/', upload_chat_image),
    path('signin/', ObtainTokenPairWithEmailView.as_view(), name='token_create'),  
    path('token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh')
]