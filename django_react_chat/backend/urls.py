from django.urls import path
from django.conf.urls import url
from .views import *
from rest_framework_simplejwt import views as jwt_views

urlpatterns = [
    path('signout/', signout),
    path('signup/', signup),
    path('is_authenticated/', is_authenticated),
    path('get_all_users/', get_all_users),
    path('get_curr_user/', get_curr_user),
    path('update_user/<pk>/', update_user),
    path('delete_user/<pk>/', delete_user),
    path('change_password/', change_password),
    path('validate_email/', validate_email),
    path('validate_password/', validate_password),
    path('manage_friends/', manage_friends),
    path('get_manage_friends_data/', get_manage_friends_data),
    path('signin/', ObtainTokenPairWithEmailView.as_view(), name='token_create'),  
    path('token/refresh/', jwt_views.TokenRefreshView.as_view(), name='token_refresh')
]