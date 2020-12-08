from django.urls import path
from django.conf.urls import url
from .views import login_view, signup, get_all_users, delete_user, update_user, validate_email

urlpatterns = [
    path('login/', login_view),
    path('signup/', signup),
    path('get_all_users/', get_all_users),
    path('update_user/<pk>/', update_user),
    path('delete_user/<pk>/', delete_user),
    path('validate_email/', validate_email)
]