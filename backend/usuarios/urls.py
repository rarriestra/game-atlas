from django.urls import path
from .views import UsuarioView

urlpatterns = [
    path('usuarios/', UsuarioView.as_view()),
    path('usuarios/<int:id>/', UsuarioView.as_view()),
]