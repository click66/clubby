from django.urls import path
from django.contrib import admin
from .views import home

urlpatterns = [
    path('', home, name='home'),
   ]