from django.urls import path
from django.conf.urls import url
from rest_framework_simplejwt import views as jwt_views
from .views import *

urlpatterns = [
    path('signout/', signout),
    path('signup/', signup),
    path('is_authenticated/', is_authenticated),
    path('get_all_users/', get_all_users),
    path('get_all_friends/', get_all_friends),
    path('get_curr_user/', get_curr_user),
    path('update_user/<pk>/', update_user),
    path('delete_user/<pk>/', delete_user),
    path('get_curr_group/<pk>/', get_curr_group),
    path('add_group/', add_group),
    path('update_group/', update_group),
    path('exit_group/', exit_group),
    path('delete_group/<pk>/', delete_group),
    path('change_password/', change_password),
    path('reset_password_signin/', reset_password_signin),
    path('validate_email/', validate_email),
    path('validate_password/', validate_password),
    path('manage_friends/', manage_friends),
    path('manage_chats/', manage_chats),
    path('get_manage_friends_data/', get_manage_friends_data),
    path('get_chat/', get_chat),
    path('get_all_conversations/', get_all_conversations),
    path('get_all_notifications/', get_all_notifications),
    path('manage_notifications/', manage_notifications),
    path('get_recent_msg_data/', get_recent_msg_data),
    path('get_conversation_modal_data/', get_conversation_modal_data),
    path('get_friends_modal_data/', get_friends_modal_data),
    path('set_last_seen/', set_last_seen),
    path('group_changes/', group_changes),
    path('upload_chat_image/', upload_chat_image),
    path('clear_chat/', clear_chat),
    path('manage_requests_last_seen/', manage_requests_last_seen),
    path('signin/', ObtainTokenPairWithEmailView.as_view(), name='token_create'),  
    path('token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh')
]