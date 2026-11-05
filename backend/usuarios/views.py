from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UsuarioSerializer


class UsuarioView(APIView):
    # Solo lectura: los usuarios se crean desde /admin
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            result = get_object_or_404(User, id=id)
            serializer = UsuarioSerializer(result)
            return Response({'status': 'success', 'data': serializer.data})
        # Incluye también a los admin: antes is_staff=False los dejaba afuera (el del createsuperuser)
        result = User.objects.filter(is_active=True).order_by('username')
        serializer = UsuarioSerializer(result, many=True)
        return Response({'status': 'success', 'data': serializer.data})