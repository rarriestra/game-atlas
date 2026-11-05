from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import contenido
from .models import Reporte, Sancion
from .permisos import es_moderador, solo_moderador
from .serializers import ReporteSerializer, SancionSerializer


class ReporteView(APIView):
    # CU24: GET /api/reportes/?moderador=1               → los pendientes
    #       GET /api/reportes/?moderador=1&estado=resueltos → el historial
    def get(self, request):
        rechazo = solo_moderador(request.query_params.get('moderador'))
        if rechazo:
            return rechazo
        result = Reporte.objects.select_related('reportante', 'autor', 'moderador')
        if request.query_params.get('estado') == 'resueltos':
            result = result.exclude(estado=Reporte.Estado.PENDIENTE).order_by('-resuelto')
        else:
            result = result.filter(estado=Reporte.Estado.PENDIENTE)
        return Response({'status': 'success', 'data': ReporteSerializer(result, many=True).data})

    # CU23: POST /api/reportes/  con  {"reportante": 2, "tipo": "RESENA", "contenido_id": 7, "motivo": "..."}
    def post(self, request):
        serializer = ReporteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ResolverReporteView(APIView):
    # CU25: POST /api/reportes/4/resolver/  con  {"moderador": 1, "accion": "eliminar" | "descartar"}
    def post(self, request, id):
        moderador_id = request.data.get('moderador')
        rechazo = solo_moderador(moderador_id)
        if rechazo:
            return rechazo
        reporte = get_object_or_404(Reporte, id=id)
        if reporte.estado != Reporte.Estado.PENDIENTE:
            return Response({'status': 'error', 'data': 'Ese reporte ya fue resuelto.'},
                            status=status.HTTP_400_BAD_REQUEST)

        accion = request.data.get('accion')
        if accion == 'eliminar':
            objeto = contenido.buscar(reporte.tipo, reporte.contenido_id)
            if objeto:
                objeto.delete()
            # Se cierran TODOS los reportes pendientes de ese contenido, no solo este
            pendientes = Reporte.objects.filter(tipo=reporte.tipo, contenido_id=reporte.contenido_id,
                                                estado=Reporte.Estado.PENDIENTE)
            pendientes.update(estado=Reporte.Estado.ELIMINADO, moderador_id=moderador_id, resuelto=timezone.now())
        elif accion == 'descartar':
            reporte.estado = Reporte.Estado.DESCARTADO
            reporte.moderador_id = moderador_id
            reporte.resuelto = timezone.now()
            reporte.save()
        else:
            return Response({'status': 'error', 'data': 'La acción tiene que ser "eliminar" o "descartar".'},
                            status=status.HTTP_400_BAD_REQUEST)

        reporte.refresh_from_db()   # update() no toca el objeto que tenemos en memoria: se vuelve a leer
        return Response({'status': 'success', 'data': ReporteSerializer(reporte).data})


class SancionView(APIView):
    # GET /api/sanciones/?usuario=5&yo=5  → las sanciones de un usuario (las ve él mismo o un moderador)
    def get(self, request):
        usuario = request.query_params.get('usuario')
        yo = request.query_params.get('yo')
        if not usuario or (yo != usuario and not es_moderador(yo)):
            return Response({'status': 'error', 'data': 'No podés ver las sanciones de otro usuario.'},
                            status=status.HTTP_403_FORBIDDEN)
        result = Sancion.objects.filter(usuario_id=usuario).select_related('usuario', 'moderador')
        return Response({'status': 'success', 'data': SancionSerializer(result, many=True).data})

    # CU26: POST /api/sanciones/  con  {"moderador": 1, "usuario": 5, "tipo": "SUSPENSION", "dias": 3,
    #                                   "motivo": "...", "reporte": 4}
    def post(self, request):
        moderador_id = request.data.get('moderador')
        rechazo = solo_moderador(moderador_id)
        if rechazo:
            return rechazo
        serializer = SancionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(moderador_id=moderador_id)
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
