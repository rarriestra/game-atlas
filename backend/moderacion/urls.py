from django.urls import path
from .views import ReporteView, ResolverReporteView, SancionView

urlpatterns = [
    path('reportes/', ReporteView.as_view()),
    path('reportes/<int:id>/resolver/', ResolverReporteView.as_view()),
    path('sanciones/', SancionView.as_view()),
]
