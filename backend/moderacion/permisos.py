"""Controles que usan las vistas de varias apps."""
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from .models import suspension_vigente


def es_moderador(usuario_id):
    """Moderador = usuario con is_staff (el mismo "admin" del selector)."""
    return bool(usuario_id) and User.objects.filter(id=usuario_id, is_staff=True).exists()


def solo_moderador(usuario_id):
    """None si es moderador; si no, la respuesta 403 lista para devolver."""
    if es_moderador(usuario_id):
        return None
    return Response({'status': 'error', 'data': 'Solo un moderador puede hacer esto.'},
                    status=status.HTTP_403_FORBIDDEN)


def rechazar_si_suspendido(usuario_id):
    """CU26: None si puede publicar; si está suspendido, la respuesta 403 con hasta cuándo."""
    sancion = suspension_vigente(usuario_id) if usuario_id else None
    if not sancion:
        return None
    hasta = timezone.localtime(sancion.fin).strftime('%d/%m/%Y %H:%M')   # localtime: hora de Argentina
    return Response({'status': 'error', 'data': f'Estás suspendido hasta el {hasta}. No podés publicar.'},
                    status=status.HTTP_403_FORBIDDEN)
