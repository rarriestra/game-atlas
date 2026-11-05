from django.urls import path
from .views import BibliotecaView

urlpatterns = [
    path('biblioteca/', BibliotecaView.as_view()),
    path('biblioteca/<int:id>/', BibliotecaView.as_view()),
]
