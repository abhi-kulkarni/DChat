from django.shortcuts import render
import os

def index_view(request):
    return render(request, 'index.html', content_type='application/javascript')