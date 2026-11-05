from django.urls import path
from .views import BibliotecaView, LikeResenaView, ResenaView, RespuestasDeResenaView, RespuestaView

urlpatterns = [
    path('biblioteca/', BibliotecaView.as_view()),
    path('biblioteca/<int:id>/', BibliotecaView.as_view()),
    path('resenas/', ResenaView.as_view()),
    path('resenas/<int:id>/', ResenaView.as_view()),
    path('resenas/<int:id>/like/', LikeResenaView.as_view()),                # NUEVO
    path('resenas/<int:id>/respuestas/', RespuestasDeResenaView.as_view()),  # NUEVO
    path('respuestas/<int:id>/', RespuestaView.as_view()),                   # NUEVO
]
