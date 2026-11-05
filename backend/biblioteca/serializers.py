from django.contrib.auth.models import User
from django.db.models import Avg
from rest_framework import serializers

from catalogo_videojuegos.models import Videojuego
from .models import BibliotecaItem, Lista, Resena, RespuestaResena


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
    # El promedio de todos los usuarios: se muestra en "Mi biblioteca" para entender ese orden
    puntaje_general = serializers.SerializerMethodField()

    class Meta:
        model = BibliotecaItem
        fields = ['id', 'usuario', 'videojuego', 'videojuego_id', 'estado', 'puntaje', 'puntaje_general', 'actualizado']
        read_only_fields = ['actualizado']

    def get_puntaje_general(self, obj):
        return obj.videojuego.en_bibliotecas.aggregate(promedio=Avg('puntaje'))['promedio']  # None = nadie lo calificó

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


class RespuestaResenaSerializer(serializers.ModelSerializer):
    usuario = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = RespuestaResena
        # la reseña no va acá: la pone la vista, sacándola de la URL (/api/resenas/5/respuestas/)
        fields = ['id', 'usuario', 'usuario_nombre', 'texto', 'creada']
        read_only_fields = ['creada']

    def validate_texto(self, valor):
        valor = valor.strip()
        if not 2 <= len(valor) <= 1000:
            raise serializers.ValidationError('La respuesta tiene que tener entre 2 y 1000 caracteres.')
        return valor


class ResenaSerializer(serializers.ModelSerializer):
    videojuego = VideojuegoResumenSerializer(read_only=True)
    videojuego_id = serializers.PrimaryKeyRelatedField(
        queryset=Videojuego.objects.all(), source='videojuego', write_only=True
    )
    usuario = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    # source='usuario.username': sigue la relación y trae el nombre (solo lectura)
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    # El puntaje que el autor le dio al juego en su biblioteca (se muestra junto a la reseña)
    puntaje = serializers.SerializerMethodField()
    # NUEVO (Guía 8)
    likes = serializers.SerializerMethodField()        # cuántos "me gusta" tiene
    me_gusta = serializers.SerializerMethodField()     # si el usuario que mira ya le dio like
    respuestas = RespuestaResenaSerializer(many=True, read_only=True)  # la conversación

    class Meta:
        model = Resena
        fields = ['id', 'usuario', 'usuario_nombre', 'videojuego', 'videojuego_id',
                  'puntaje', 'texto', 'creada', 'editada', 'likes', 'me_gusta', 'respuestas']
        read_only_fields = ['creada', 'editada']

    def get_puntaje(self, obj):
        item = BibliotecaItem.objects.filter(usuario=obj.usuario, videojuego=obj.videojuego).first()
        return item.puntaje if item else None

    def get_likes(self, obj):
        # Si la vista ya los contó con annotate, usa ese número; si no, los cuenta
        return getattr(obj, 'cantidad_likes', None) or obj.likes.count()

    def get_me_gusta(self, obj):
        # 'yo' es el id del usuario que está mirando: lo pasa la vista en el context
        yo = self.context.get('yo')
        return bool(yo) and obj.likes.filter(usuario_id=yo).exists()

    def validate_texto(self, valor):
        """validate_<campo>: DRF la llama solo para ese campo."""
        valor = valor.strip()
        if len(valor) < 10:
            raise serializers.ValidationError('La reseña tiene que tener al menos 10 caracteres.')
        return valor

    def validate(self, attrs):
        """CU06: solo se puede reseñar un juego que el usuario ya calificó (CU05)."""
        if self.instance is None:  # solo al crear; al editar ya se validó en su momento
            calificado = BibliotecaItem.objects.filter(
                usuario=attrs['usuario'], videojuego=attrs['videojuego'], puntaje__isnull=False
            ).exists()
            if not calificado:
                raise serializers.ValidationError(
                    'Para escribir una reseña, primero calificá el juego desde tu biblioteca.'
                )
        return attrs

    def update(self, instance, validated_data):
        # CU07: al editar solo cambia el texto (el autor y el juego quedan fijos)
        validated_data.pop('usuario', None)
        validated_data.pop('videojuego', None)
        return super().update(instance, validated_data)


class ListaSerializer(serializers.ModelSerializer):
    """Lista personal (CU09 a CU11)."""
    usuario = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    # Para leer: los juegos con título y portada. Para escribir: solo los ids, en videojuegos_ids
    videojuegos = VideojuegoResumenSerializer(many=True, read_only=True)
    videojuegos_ids = serializers.PrimaryKeyRelatedField(
        queryset=Videojuego.objects.all(), source='videojuegos', many=True, write_only=True, required=False
    )

    class Meta:
        model = Lista
        fields = ['id', 'usuario', 'usuario_nombre', 'nombre', 'descripcion',
                  'videojuegos', 'videojuegos_ids', 'creada', 'actualizada']
        read_only_fields = ['creada', 'actualizada']
        # Se apaga el control automático del nombre repetido: lo hacemos en validate() con un mensaje en castellano
        validators = []

    def validate_nombre(self, valor):
        valor = valor.strip()
        if not valor:
            raise serializers.ValidationError('La lista necesita un nombre.')
        return valor

    def validate(self, attrs):
        # En un PATCH puede no venir el usuario: se toma el de la lista guardada
        usuario = attrs.get('usuario', getattr(self.instance, 'usuario', None))
        nombre = attrs.get('nombre')
        if nombre:
            repetida = Lista.objects.filter(usuario=usuario, nombre__iexact=nombre)  # iexact: sin importar mayúsculas
            if self.instance:
                repetida = repetida.exclude(id=self.instance.id)   # al editar, no se compara consigo misma
            if repetida.exists():
                raise serializers.ValidationError({'nombre': 'Ya tenés una lista con ese nombre.'})
        return attrs

    def update(self, instance, validated_data):
        validated_data.pop('usuario', None)   # el dueño no se cambia
        return super().update(instance, validated_data)
