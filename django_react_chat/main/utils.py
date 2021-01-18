from backend.serializers import MyTokenObtainPairSerializer, UserSerializer
from storages.backends.s3boto import S3BotoStorage
from django.contrib.staticfiles.storage import ManifestFilesMixin


class CustomS3Storage(ManifestFilesMixin, S3BotoStorage):
    pass

StaticRootS3BotoStorage = lambda: CustomS3Storage(location='static')
MediaRootS3BotoStorage  = lambda: S3BotoStorage(location='uploads')

def custom_jwt_response_handler(token, user=None, request=None):

    return {
        'token': token,
        'user': UserSerializer(request.user).data
    }
