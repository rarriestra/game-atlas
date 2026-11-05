from django.urls import path
from .views import (BibliotecaView, LikeResenaView, ListaJuegoView, ListaView, ResenaView,
                    RespuestasDeResenaView, RespuestaView)

urlpatterns = [
    path('biblioteca/', BibliotecaView.as_view()),
    path('biblioteca/<int:id>/', BibliotecaView.as_view()),
    path('resenas/', ResenaView.as_view()),
    path('resenas/<int:id>/', ResenaView.as_view()),
    path('resenas/<int:id>/like/', LikeResenaView.as_view()),                # NUEVO
    path('resenas/<int:id>/respuestas/', RespuestasDeResenaView.as_view()),  # NUEVO
    path('respuestas/<int:id>/', RespuestaView.as_view()),                   # NUEVO
    # NUEVO (Guía 11): listas personales
    path('listas/', ListaView.as_view()),
    path('listas/<int:id>/', ListaView.as_view()),
    path('listas/<int:id>/videojuegos/', ListaJuegoView.as_view()),
]
