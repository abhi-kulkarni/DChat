from backend.serializers import MyTokenObtainPairSerializer, UserSerializer


def custom_jwt_response_handler(token, user=None, request=None):

    print('HELLO')
    print(request)
    print(user)

    return {
        'token': token,
        'user': UserSerializer(request.user).data
    }