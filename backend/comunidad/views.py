from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Comentario, Topico
from .serializers import ComentarioSerializer, TopicoDetalleSerializer, TopicoSerializer


class TopicoView(APIView):
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            # CU12: un tópico con todos sus comentarios
            topico = get_object_or_404(Topico, id=id)
            return Response({'status': 'success', 'data': TopicoDetalleSerializer(topico).data})

        # CU12: lista de tópicos (de un juego, o los últimos de todo el sitio)
        result = Topico.objects.select_related('usuario', 'videojuego')
        videojuego = request.query_params.get('videojuego')
        if videojuego:
            result = result.filter(videojuego_id=videojuego)
        limite = request.query_params.get('limite')
        if limite and limite.isdigit():
            result = result[:int(limite)]
        return Response({'status': 'success', 'data': TopicoSerializer(result, many=True).data})

    def post(self, request):
        # CU13: crear tópico
        serializer = TopicoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, id):
        # CU14: editar tópico
        topico = get_object_or_404(Topico, id=id)
        serializer = TopicoSerializer(topico, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data})
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        # CU15: eliminar tópico (se borran también sus comentarios, por el CASCADE)
        topico = get_object_or_404(Topico, id=id)
        topico.delete()
        return Response({'status': 'success', 'data': 'Record Deleted'})


class ComentariosDeTopicoView(APIView):
    # CU16: POST /api/topicos/3/comentarios/  con  {"usuario": 2, "texto": "...", "respuesta_a": 7 (opcional)}
    def post(self, request, id):
        topico = get_object_or_404(Topico, id=id)
        serializer = ComentarioSerializer(data=request.data, context={'topico': topico})
        if serializer.is_valid():
            serializer.save(topico=topico)
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ComentarioView(APIView):
    def patch(self, request, id):
        # CU17: editar comentario
        comentario = get_object_or_404(Comentario, id=id)
        serializer = ComentarioSerializer(comentario, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data})
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        # CU18: eliminar comentario (si tenía respuestas, se borran con él)
        comentario = get_object_or_404(Comentario, id=id)
        comentario.delete()
        return Response({'status': 'success', 'data': 'Record Deleted'})
