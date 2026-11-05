from django.urls import path
from .views import ActividadView, ListaSeguimientoView, SeguirView, UsuarioView

urlpatterns = [
    path('usuarios/', UsuarioView.as_view()),
    path('usuarios/<int:id>/', UsuarioView.as_view()),
    # NUEVO (Guía 10)
    path('usuarios/<int:id>/seguir/', SeguirView.as_view()),
    path('usuarios/<int:id>/seguidores/', ListaSeguimientoView.as_view(), {'lista': 'seguidores'}),
    path('usuarios/<int:id>/siguiendo/', ListaSeguimientoView.as_view(), {'lista': 'siguiendo'}),
    path('actividad/', ActividadView.as_view()),
]
