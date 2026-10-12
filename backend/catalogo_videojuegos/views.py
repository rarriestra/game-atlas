from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Videojuego
from .serializers import VideojuegoSerializer


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
        result = Videojuego.objects.all()
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