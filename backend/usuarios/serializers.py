from django.contrib.auth.models import User   # el modelo de usuarios que trae Django
from rest_framework import serializers


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Solo datos públicos: nunca mandar password ni email
        fields = ['id', 'username', 'first_name', 'last_name', 'is_staff']   # NUEVO: is_staff = es administrador