from django.urls import path
from .views import VideojuegoView

urlpatterns = [
    path('videojuegos/', VideojuegoView.as_view()),
    path('videojuegos/<int:id>/', VideojuegoView.as_view()), # .as_view() convierte la clase en una vista que puede ser llamada por Django
]