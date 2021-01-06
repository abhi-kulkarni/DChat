from django.shortcuts import render
import os

def index_view(request):
    return render(request, 'frontend/index.html')