from django.db import models
import uuid
from django.contrib.auth.models import AbstractUser
import datetime
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from friendship.exceptions import AlreadyExistsError, AlreadyFriendsError
from friendship.signals import (
    friendship_removed,
    friendship_request_accepted,
    friendship_request_canceled,
    friendship_request_created,
    friendship_request_rejected,
    friendship_request_viewed,
)

AUTH_USER_MODEL = getattr(settings, "AUTH_USER_MODEL", "auth.User")

class Notification(models.Model):
    from django_mysql.models import ListCharField

    participants = ListCharField(
        base_field=models.CharField(max_length=10),
        size=5,
        max_length=(5 * 11)
    )
    message = models.TextField(max_length=100*100, blank=False, default='')
    friend = models.IntegerField(blank=False)
    created_on = models.DateTimeField(default=timezone.now)
    notification_type = models.CharField(blank=False, max_length=20, default='')
    read = models.BooleanField(default=False)


class Room(models.Model):

    room_group_name = models.CharField(max_length=200, default=None, blank=True, unique=True)
    channel_name = models.CharField(max_length=200, blank=False, default='')

class User(AbstractUser):

    created_on = models.DateTimeField(null=datetime.datetime.now())
    updated_on = models.DateTimeField(null=datetime.datetime.now())
    last_passwords = models.TextField(null=True)
    expiry_token = models.CharField(max_length=50, null=True, default=None)
    expiry_date = models.DateTimeField(null=True)
    sso = models.BooleanField(null=True)
    locked = models.BooleanField(null=True)
    provider = models.CharField(max_length=20, null=True)
    last_login = models.DateTimeField(null=True)
    profile_picture = models.TextField(null=True)
    extra_data = models.TextField(null=True)
    gender = models.CharField(null=True, max_length=20)
    country = models.CharField(null=True, max_length=50)
    email = models.EmailField(blank=True, unique=True)
    notifications = models.ManyToManyField(Notification, blank=True, related_name='notifications', default=None)
    channel_rooms = models.ManyToManyField(Room, blank=True, related_name='notifications', default=None)

    EMAIL_FIELD = 'email'
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']


class Message(models.Model):
    user = models.ForeignKey(
        User, related_name='messages', on_delete=models.CASCADE, default=None)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username


class Chat(models.Model):

    id = models.UUIDField(primary_key=True, unique=True, default=uuid.uuid4)
    participants = models.ManyToManyField(
        User, related_name='chats', blank=True)
    messages = models.ManyToManyField(Message, blank=True)
    last_seen = models.TextField(max_length=200, default='')
    status = models.BooleanField(default=False)

    def __str__(self):
        return "{}".format(self.pk)



CACHE_TYPES = {
    "chat_friends": "cf-%s",
    "chat_requests": "cfr-%s",
    "chat_sent_requests": "scfr-%s",
    "chat_unread_requests": "cfru-%s",
    "chat_unread_request_count": "cfruc-%s",
    "chat_read_requests": "cfrr-%s",
    "chat_rejected_requests": "cfrj-%s",
    "chat_unrejected_requests": "cfrur-%s",
    "chat_unrejected_request_count": "cfrurc-%s",
    "friends": "f-%s",
    "followers": "fo-%s",
    "following": "fl-%s",
    "blocks": "b-%s",
    "blocked": "bo-%s",
    "blocking": "bd-%s",
    "requests": "fr-%s",
    "sent_requests": "sfr-%s",
    "unread_requests": "fru-%s",
    "unread_request_count": "fruc-%s",
    "read_requests": "frr-%s",
    "rejected_requests": "frj-%s",
    "unrejected_requests": "frur-%s",
    "unrejected_request_count": "frurc-%s",
}

BUST_CACHES = {
    "friends": ["friends"],
    "chat_friends": ["chat_friends"],
    "followers": ["followers"],
    "blocks": ["blocks"],
    "blocked": ["blocked"],
    "following": ["following"],
    "blocking": ["blocking"],
    "chat_requests": [
        "chat_requests",
        "chat_unread_requests",
        "chat_unread_request_count",
        "chat_read_requests",
        "chat_rejected_requests",
        "chat_unrejected_requests",
        "chat_unrejected_request_count",
    ],
    "requests": [
        "requests",
        "unread_requests",
        "unread_request_count",
        "read_requests",
        "rejected_requests",
        "unrejected_requests",
        "unrejected_request_count",
    ],
    "chat_sent_requests": ["chat_sent_requests"],
    "sent_requests": ["sent_requests"],
}


def cache_key(type, user_pk):
    """
    Build the cache key for a particular type of cached value
    """
    return CACHE_TYPES[type] % user_pk


def bust_cache(type, user_pk):
    """
    Bust our cache for a given type, can bust multiple caches
    """
    bust_keys = BUST_CACHES[type]
    keys = [CACHE_TYPES[k] % user_pk for k in bust_keys]
    cache.delete_many(keys)


class ChatRequest(models.Model):
    """ Model to represent chat requests """

    from_user = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_requests_sent",
    )
    to_user = models.ForeignKey(
        AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_requests_received",
    )

    message = models.TextField(_("Message"), blank=True)

    created = models.DateTimeField(default=timezone.now)
    rejected = models.DateTimeField(blank=True, null=True)
    viewed = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = _("Chat Request")
        verbose_name_plural = _("Chat Requests")
        unique_together = ("from_user", "to_user")

    def __str__(self):
        return "%s" % self.from_user_id

    def accept(self):
        """ Accept this chat request """
        ChatFriend.objects.create(from_user=self.from_user, to_user=self.to_user)

        ChatFriend.objects.create(from_user=self.to_user, to_user=self.from_user)

        friendship_request_accepted.send(
            sender=self, from_user=self.from_user, to_user=self.to_user
        )

        self.delete()

        # Delete any reverse requests
        ChatRequest.objects.filter(
            from_user=self.to_user, to_user=self.from_user
        ).delete()

        # Bust requests cache - request is deleted
        bust_cache("chat_requests", self.to_user.pk)
        bust_cache("chat_sent_requests", self.from_user.pk)
        # Bust reverse requests cache - reverse request might be deleted
        bust_cache("chat_requests", self.from_user.pk)
        bust_cache("chat_sent_requests", self.to_user.pk)
        # Bust friends cache - new friends added
        bust_cache("chat_friends", self.to_user.pk)
        bust_cache("chat_friends", self.from_user.pk)

        return True

    def reject(self):
        """ reject this friendship request """
        self.rejected = timezone.now()
        self.save()
        friendship_request_rejected.send(sender=self)
        bust_cache("chat_requests", self.to_user.pk)

    def cancel(self):
        """ cancel this friendship request """
        self.delete()
        friendship_request_canceled.send(sender=self)
        bust_cache("chat_requests", self.to_user.pk)
        bust_cache("chat_sent_requests", self.from_user.pk)
        return True

    def mark_viewed(self):
        self.viewed = timezone.now()
        friendship_request_viewed.send(sender=self)
        self.save()
        bust_cache("chat_requests", self.to_user.pk)
        return True


class ChatManager(models.Manager):
    """ Chat manager """

    def chat_friends(self, user):
        """ Return a list of all friends """
        key = cache_key("chat_friends", user.pk)
        friends = cache.get(key)

        if friends is None:
            qs = (
                ChatFriend.objects.select_related("from_user", "to_user")
                .filter(to_user=user)
                .all()
            )
            friends = [u.from_user for u in qs]
            cache.set(key, friends)

        return friends
    

    def online_friends(self, user):
        """ Return a list of all online friends """
        key = cache_key("friends", user.pk)
        friends = cache.get(key)

        if friends is None:
            qs = (
                Friend.objects.select_related("from_user", "to_user")
                .filter(to_user=user).filter(online_status=True)
                .all()
            )
            friends = [u.from_user for u in qs]
            cache.set(key, friends)

        return friends

    def online_chat_friends(self, user):
        """ Return a list of all online chat friends """
        key = cache_key("chat_friends", user.pk)
        friends = cache.get(key)

        if friends is None:
            qs = (
                ChatFriend.objects.select_related("from_user", "to_user")
                .filter(to_user=user).all()
            )
            friends = [u.from_user for u in qs]
            cache.set(key, friends)

        return friends

    def requests(self, user):
        """ Return a list of chat requests """
        key = cache_key("chat_requests", user.pk)
        requests = cache.get(key)

        if requests is None:
            qs = (
                ChatRequest.objects.select_related("from_user", "to_user")
                .filter(to_user=user)
                .all()
            )
            requests = list(qs)
            cache.set(key, requests)

        return requests

    def sent_requests(self, user):
        """ Return a list of chat requests from user """
        key = cache_key("chat_sent_requests", user.pk)
        requests = cache.get(key)

        if requests is None:
            qs = (
                ChatRequest.objects.select_related("from_user", "to_user")
                .filter(from_user=user)
                .all()
            )
            requests = list(qs)
            cache.set(key, requests)

        return requests

    def unread_requests(self, user):
        """ Return a list of unread chat requests """
        key = cache_key("chat_unread_requests", user.pk)
        unread_requests = cache.get(key)

        if unread_requests is None:
            qs = (
                ChatRequest.objects.select_related("from_user", "to_user")
                .filter(to_user=user, viewed__isnull=True)
                .all()
            )
            unread_requests = list(qs)
            cache.set(key, unread_requests)

        return unread_requests

    def unread_request_count(self, user):
        """ Return a count of unread friendship requests """
        key = cache_key("chat_unread_request_count", user.pk)
        count = cache.get(key)

        if count is None:
            count = (
                ChatRequest.objects.select_related("from_user", "to_user")
                .filter(to_user=user, viewed__isnull=True)
                .count()
            )
            cache.set(key, count)

        return count

    def read_requests(self, user):
        """ Return a list of read friendship requests """
        key = cache_key("chat_read_requests", user.pk)
        read_requests = cache.get(key)

        if read_requests is None:
            qs = (
                ChatRequest.objects.select_related("from_user", "to_user")
                .filter(to_user=user, viewed__isnull=False)
                .all()
            )
            read_requests = list(qs)
            cache.set(key, read_requests)

        return read_requests

    def rejected_requests(self, user):
        """ Return a list of rejected friendship requests """
        key = cache_key("chat_rejected_requests", user.pk)
        rejected_requests = cache.get(key)

        if rejected_requests is None:
            qs = (
                ChatRequest.objects.select_related("from_user", "to_user")
                .filter(to_user=user, rejected__isnull=False)
                .all()
            )
            rejected_requests = list(qs)
            cache.set(key, rejected_requests)

        return rejected_requests

    def unrejected_requests(self, user):
        """ All requests that haven't been rejected """
        key = cache_key("chat_unrejected_requests", user.pk)
        unrejected_requests = cache.get(key)

        if unrejected_requests is None:
            qs = (
                ChatRequest.objects.select_related("from_user", "to_user")
                .filter(to_user=user, rejected__isnull=True)
                .all()
            )
            unrejected_requests = list(qs)
            cache.set(key, unrejected_requests)

        return unrejected_requests

    def unrejected_request_count(self, user):
        """ Return a count of unrejected chat requests """
        key = cache_key("chat_unrejected_request_count", user.pk)
        count = cache.get(key)

        if count is None:
            count = (
                ChatRequest.objects.select_related("from_user", "to_user")
                .filter(to_user=user, rejected__isnull=True)
                .count()
            )
            cache.set(key, count)

        return count

    def add_friend(self, from_user, to_user, message=None):
        """ Create a chat request """
        if from_user == to_user:
            raise ValidationError("Users cannot be chat friends with themselves")

        if self.are_friends(from_user, to_user):
            raise AlreadyFriendsError("Users are already chat friends")

        if self.can_request_send(from_user, to_user):
            raise AlreadyExistsError("Chat Friendship already requested")

        if message is None:
            message = ""

        request, created = ChatRequest.objects.get_or_create(
            from_user=from_user, to_user=to_user
        )

        if created is False:
            raise AlreadyExistsError("Friendship already requested")

        if message:
            request.message = message
            request.save()

        bust_cache("chat_requests", to_user.pk)
        bust_cache("chat_sent_requests", from_user.pk)
        friendship_request_created.send(sender=request)

        return request

    def can_request_send(self, from_user, to_user):
        """ Checks if a request was sent """
        if from_user == to_user:
            return False

        if not ChatRequest.objects.filter(
            from_user=from_user, to_user=to_user
        ).exists():
            return False

        return True

    def remove_friend(self, from_user, to_user):
        """ Destroy a friendship relationship """
        try:
            qs = (
                ChatFriend.objects.filter(
                    Q(to_user=to_user, from_user=from_user)
                    | Q(to_user=from_user, from_user=to_user)
                )
                .distinct()
                .all()
            )

            if qs:
                friendship_removed.send(
                    sender=qs[0], from_user=from_user, to_user=to_user
                )
                qs.delete()
                bust_cache("chat_friends", to_user.pk)
                bust_cache("chat_friends", from_user.pk)
                return True
            else:
                return False
        except ChatFriend.DoesNotExist:
            return False

    def are_friends(self, user1, user2):
        """ Are these two users friends? """
        friends1 = cache.get(cache_key("chat_friends", user1.pk))
        friends2 = cache.get(cache_key("chat_friends", user2.pk))
        if friends1 and user2 in friends1:
            return True
        elif friends2 and user1 in friends2:
            return True
        else:
            try:
                ChatFriend.objects.get(to_user=user1, from_user=user2)
                return True
            except ChatFriend.DoesNotExist:
                return False


class ChatFriend(models.Model):
    """ Model to represent Chat Friendships """

    to_user = models.ForeignKey(AUTH_USER_MODEL, models.CASCADE, related_name="chat_friends")
    from_user = models.ForeignKey(
        AUTH_USER_MODEL, models.CASCADE, related_name="_unused_chat_friend_relation"
    )
    created = models.DateTimeField(default=timezone.now)
    online_status = models.BooleanField(default=False)
    objects = ChatManager()

    class Meta:
        verbose_name = _("Chat_Friend")
        verbose_name_plural = _("Chat_Friends")
        unique_together = ("from_user", "to_user")

    def __str__(self):
        return "User #%s is chat_friends with #%s" % (self.to_user_id, self.from_user_id)

    def save(self, *args, **kwargs):
        # Ensure users can't be friends with themselves
        if self.to_user == self.from_user:
            raise ValidationError("Users cannot be chat friends with themselves.")
        super(ChatFriend, self).save(*args, **kwargs)