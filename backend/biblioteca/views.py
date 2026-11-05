from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BibliotecaItem
from .serializers import BibliotecaItemSerializer


class BibliotecaView(APIView):
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            item = get_object_or_404(BibliotecaItem, id=id)
            return Response({'status': 'success', 'data': BibliotecaItemSerializer(item).data})

        # select_related trae el juego en la misma consulta (si no, haría una consulta por item)
        result = BibliotecaItem.objects.select_related('videojuego')
        usuario = request.query_params.get('usuario')
        videojuego = request.query_params.get('videojuego')
        estado = request.query_params.get('estado')
        if usuario:
            result = result.filter(usuario_id=usuario)
        if videojuego:
            result = result.filter(videojuego_id=videojuego)
        if estado:
            result = result.filter(estado=estado)
        serializer = BibliotecaItemSerializer(result, many=True)
        return Response({'status': 'success', 'data': serializer.data})

    def post(self, request):
        serializer = BibliotecaItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, id):
        item = get_object_or_404(BibliotecaItem, id=id)
        serializer = BibliotecaItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data})
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        item = get_object_or_404(BibliotecaItem, id=id)
        item.delete()
        return Response({'status': 'success', 'data': 'Record Deleted'})
