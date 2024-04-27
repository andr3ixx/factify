from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('analyze_text/', views.analyze_text, name='analyze_text'),
]
