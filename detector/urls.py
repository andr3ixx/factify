from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('analyze_text/', views.analyze_text, name='analyze_text'),
    path('process_data/', views.process_data, name='process_data'),
]
