from django.urls import path
from .views import ComentarioView, ComentariosDeTopicoView, TopicoView

urlpatterns = [
    path('topicos/', TopicoView.as_view()),
    path('topicos/<int:id>/', TopicoView.as_view()),
    path('topicos/<int:id>/comentarios/', ComentariosDeTopicoView.as_view()),
    path('comentarios/<int:id>/', ComentarioView.as_view()),
]
