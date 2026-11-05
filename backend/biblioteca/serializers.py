from django.contrib.auth.models import User
from rest_framework import serializers

from catalogo_videojuegos.models import Videojuego
from .models import BibliotecaItem


class VideojuegoResumenSerializer(serializers.ModelSerializer):
    """Solo lo necesario para mostrar el juego en la biblioteca (no todo el detalle)."""
    class Meta:
        model = Videojuego
        fields = ['id', 'titulo', 'portada_url']


class BibliotecaItemSerializer(serializers.ModelSerializer):
    # Para leer: el juego con título y portada. Para escribir: solo su id, en videojuego_id
    videojuego = VideojuegoResumenSerializer(read_only=True)
    videojuego_id = serializers.PrimaryKeyRelatedField(
        queryset=Videojuego.objects.all(), source='videojuego', write_only=True
    )
    usuario = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = BibliotecaItem
        fields = ['id', 'usuario', 'videojuego', 'videojuego_id', 'estado', 'puntaje', 'actualizado']
        read_only_fields = ['actualizado']

    def validate(self, attrs):
        """Regla del CU04/CU05: solo se califica si el estado es Jugando, Completado o Abandonado."""
        # En un PATCH puede venir solo una de las dos cosas: lo que falta se toma de lo guardado
        estado = attrs.get('estado', getattr(self.instance, 'estado', BibliotecaItem.Estado.PENDIENTE))
        calificable = estado in BibliotecaItem.ESTADOS_CALIFICABLES

        if attrs.get('puntaje') is not None and not calificable:
            raise serializers.ValidationError(
                {'puntaje': 'Solo se puede calificar un juego Jugando, Completado o Abandonado.'}
            )
        # Si solo cambia el estado a Pendiente, el puntaje que ya tenía se conserva
        return attrs

    def update(self, instance, validated_data):
        # El dueño y el juego no se cambian: para eso se quita y se agrega de nuevo
        validated_data.pop('usuario', None)
        validated_data.pop('videojuego', None)
        return super().update(instance, validated_data)
