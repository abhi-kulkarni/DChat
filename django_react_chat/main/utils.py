from backend.serializers import MyTokenObtainPairSerializer, UserSerializer


def custom_jwt_response_handler(token, user=None, request=None):

    return {
        'token': token,
        'user': UserSerializer(request.user).data
    }