from django.db.models import Avg, Count
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
    generos = GeneroSerializer(many=True, read_only=True)
    plataformas = PlataformaSerializer(many=True, read_only=True)

    generos_ids = serializers.PrimaryKeyRelatedField(
        queryset=Genero.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )
    plataformas_ids = serializers.PrimaryKeyRelatedField(
        queryset=Plataforma.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )

    # NUEVO (CU05): promedio de los puntajes que le dieron los usuarios en sus bibliotecas
    puntaje_promedio = serializers.SerializerMethodField()
    cantidad_puntajes = serializers.SerializerMethodField()

    class Meta:
        model = Videojuego
        fields = '__all__' # Serialize all fields of the Videojuego model
        read_only_fields = ['igdb_id'] # lo completa solo la importación, no se edita a mano

    def _puntajes(self, obj):
        # en_bibliotecas es el related_name del ForeignKey en BibliotecaItem
        return obj.en_bibliotecas.filter(puntaje__isnull=False).aggregate(promedio=Avg('puntaje'), cantidad=Count('id'))

    def get_puntaje_promedio(self, obj):
        promedio = self._puntajes(obj)['promedio']
        return round(promedio, 1) if promedio is not None else None  # None = nadie lo calificó

    def get_cantidad_puntajes(self, obj):
        return self._puntajes(obj)['cantidad']

    def create(self, validated_data):
        generos = validated_data.pop('generos_ids', [])
        plataformas = validated_data.pop('plataformas_ids', [])

        videojuego = Videojuego.objects.create(**validated_data)
        videojuego.generos.set(generos)
        videojuego.plataformas.set(plataformas)
        return videojuego

    def update(self, instance, validated_data):
        # None = si no se manda el campo, no se tocan las relaciones existentes
        generos = validated_data.pop('generos_ids', None)
        plataformas = validated_data.pop('plataformas_ids', None)

        # Actualizar campos comunes del modelo Videojuego
        for campo, valor in validated_data.items():
            setattr(instance, campo, valor) # copia cada campo recibido al juego existente
        instance.save() # persiste los cambios en la base de datos

        # Actualizar relaciones si se proporcionan nuevos valores
        if generos is not None:
            instance.generos.set(generos) # carga los generos directamente en la tabla intermedia
        if plataformas is not None:
            instance.plataformas.set(plataformas)
        return instance