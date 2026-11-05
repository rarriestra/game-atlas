from django.urls import path
from .views import BibliotecaView, ResenaView

urlpatterns = [
    path('biblioteca/', BibliotecaView.as_view()),
    path('biblioteca/<int:id>/', BibliotecaView.as_view()),
    path('resenas/', ResenaView.as_view()),           # NUEVO
    path('resenas/<int:id>/', ResenaView.as_view()),  # NUEVO
]
