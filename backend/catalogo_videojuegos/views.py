from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Genero, Plataforma, Videojuego
from .serializers import VideojuegoSerializer, PlataformaSerializer, GeneroSerializer


class VideojuegoView(APIView):
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            result = get_object_or_404(Videojuego, id=id)
            serializer = VideojuegoSerializer(result)
            return Response(
                {'status': 'success', 'data': serializer.data},
                status=status.HTTP_200_OK
            )
        result = Videojuego.objects.all().order_by('titulo')
        titulo = request.query_params.get('titulo')
        genero = request.query_params.get('genero')
        plataforma = request.query_params.get('plataforma')
        if titulo:
            result = result.filter(titulo__icontains=titulo) # i: insensitive (no case sensitive)
        if genero:
            result = result.filter(generos__id=genero)
        if plataforma:
            result = result.filter(plataformas__id=plataforma)
        serializer = VideojuegoSerializer(result, many=True)
        return Response(
            {'status': 'success', 'data': serializer.data},
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = VideojuegoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'status': 'success', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def put(self, request, id):
        result = get_object_or_404(Videojuego, id=id)
        serializer = VideojuegoSerializer(result, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'status': 'success', 'data': serializer.data}
            )
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, id):
        result = get_object_or_404(Videojuego, id=id)
        serializer = VideojuegoSerializer(
            result,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'status': 'success', 'data': serializer.data}
            )
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, id):
        result = get_object_or_404(Videojuego, id=id)
        result.delete()
        return Response(
            {'status': 'success', 'data': 'Record Deleted'}
        )
class GeneroView(APIView):
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            result = get_object_or_404(Genero, id=id)
            serializer = GeneroSerializer(result)
            return Response({'status': 'success', 'data': serializer.data})
        result = Genero.objects.all().order_by('nombre')
        serializer = GeneroSerializer(result, many=True)
        return Response({'status': 'success', 'data': serializer.data})

    def post(self, request):
        serializer = GeneroSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'status': 'success', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, id):
        result = get_object_or_404(Genero, id=id)
        serializer = GeneroSerializer(result, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data})
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, id):
        result = get_object_or_404(Genero, id=id)
        result.delete()
        return Response({'status': 'success', 'data': 'Record Deleted'})

class PlataformaView(APIView):
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            result = get_object_or_404(Plataforma, id=id)
            serializer = PlataformaSerializer(result)
            return Response({'status': 'success', 'data': serializer.data})
        result = Plataforma.objects.all().order_by('nombre')
        serializer = PlataformaSerializer(result, many=True)
        return Response({'status': 'success', 'data': serializer.data})

    def post(self, request):
        serializer = PlataformaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'status': 'success', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, id):
        result = get_object_or_404(Plataforma, id=id)
        serializer = PlataformaSerializer(result, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data})
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, id):
        result = get_object_or_404(Plataforma, id=id)
        result.delete()
        return Response({'status': 'success', 'data': 'Record Deleted'})
