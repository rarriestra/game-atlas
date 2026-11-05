from django.contrib.auth.models import User   # el modelo de usuarios que trae Django
from rest_framework import serializers


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Solo datos públicos: nunca mandar password ni email
        fields = ['id', 'username', 'first_name', 'last_name', 'is_staff']   # NUEVO: is_staff = es administrador


class PerfilSerializer(UsuarioSerializer):
    """El usuario + datos sociales, para la página de perfil (RF11)."""
    seguidores = serializers.SerializerMethodField()   # cuántos lo siguen
    siguiendo = serializers.SerializerMethodField()    # a cuántos sigue
    lo_sigo = serializers.SerializerMethodField()      # si el usuario que mira ya lo sigue

    class Meta(UsuarioSerializer.Meta):
        fields = UsuarioSerializer.Meta.fields + ['seguidores', 'siguiendo', 'lo_sigo']

    def get_seguidores(self, obj):
        return obj.seguidores.count()   # related_name='seguidores' del modelo Seguimiento

    def get_siguiendo(self, obj):
        return obj.siguiendo.count()

    def get_lo_sigo(self, obj):
        yo = self.context.get('yo')
        return bool(yo) and obj.seguidores.filter(seguidor_id=yo).exists()
