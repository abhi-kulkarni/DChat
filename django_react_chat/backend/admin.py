from django.contrib import admin
from .models import User, Chat, Message


class UserAdmin(admin.ModelAdmin):
    model = User

class ChatAdmin(admin.ModelAdmin):
    model = Chat

class MessageAdmin(admin.ModelAdmin):
    model = Message

admin.site.register(User, UserAdmin)
admin.site.register(Chat, ChatAdmin)
admin.site.register(Message, MessageAdmin)
