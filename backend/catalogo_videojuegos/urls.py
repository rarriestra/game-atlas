from django.urls import path
from .views import GeneroView, PlataformaView, VideojuegoView

urlpatterns = [
    path('videojuegos/', VideojuegoView.as_view()),
    path('videojuegos/<int:id>/', VideojuegoView.as_view()),
    path('generos/', GeneroView.as_view()),
    path('generos/<int:id>/', GeneroView.as_view()),
    path('plataformas/', PlataformaView.as_view()),
    path('plataformas/<int:id>/', PlataformaView.as_view()),
]