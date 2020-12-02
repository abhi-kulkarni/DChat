from django.shortcuts import render,HttpResponse

# Create your views here.


def login_view(request):

    print("LOGIN CALLED")
    return HttpResponse("LOGIN CALLED")