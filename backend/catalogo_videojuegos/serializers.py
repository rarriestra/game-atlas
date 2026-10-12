from rest_framework import serializers
from .models import Genero, Plataforma, Videojuego


class GeneroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genero
        fields = '__all__' # Serialize all fields of the Genero model


class PlataformaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plataforma
        fields = '__all__' # Serialize all fields of the Plataforma model


class VideojuegoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Videojuego
        fields = '__all__' # Serialize all fields of the Videojuego model