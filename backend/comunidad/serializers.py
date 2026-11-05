from django.contrib.auth.models import User
from rest_framework import serializers

from biblioteca.serializers import VideojuegoResumenSerializer
from catalogo_videojuegos.models import Videojuego
from .models import Comentario, Topico


class RespuestaComentarioSerializer(serializers.ModelSerializer):
    """Una respuesta (comentario hijo). No tiene sus propias respuestas: un solo nivel."""
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = Comentario
        fields = ['id', 'usuario', 'usuario_nombre', 'texto', 'respuesta_a', 'creado', 'editado']


class ComentarioSerializer(serializers.ModelSerializer):
    usuario = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    respuesta_a = serializers.PrimaryKeyRelatedField(
        queryset=Comentario.objects.all(), required=False, allow_null=True
    )
    respuestas = RespuestaComentarioSerializer(many=True, read_only=True)

    class Meta:
        model = Comentario
        fields = ['id', 'usuario', 'usuario_nombre', 'texto', 'respuesta_a', 'respuestas', 'creado', 'editado']
        read_only_fields = ['creado', 'editado']

    def validate_texto(self, valor):
        valor = valor.strip()
        if not 2 <= len(valor) <= 2000:
            raise serializers.ValidationError('El comentario tiene que tener entre 2 y 2000 caracteres.')
        return valor

    def validate(self, attrs):
        padre = attrs.get('respuesta_a')
        if padre:
            # La vista manda el tópico de la URL en el context
            topico = self.context.get('topico')
            if topico and padre.topico_id != topico.id:
                raise serializers.ValidationError('Ese comentario es de otro tópico.')
            # Un solo nivel: si responden a una respuesta, se cuelga del comentario principal
            if padre.respuesta_a_id:
                attrs['respuesta_a'] = padre.respuesta_a
        return attrs

    def update(self, instance, validated_data):
        # CU17: al editar solo cambia el texto
        return super().update(instance, {'texto': validated_data.get('texto', instance.texto)})


class TopicoSerializer(serializers.ModelSerializer):
    """Para la lista de tópicos: sin los comentarios, pero con cuántos tiene."""
    usuario = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    videojuego = VideojuegoResumenSerializer(read_only=True)
    videojuego_id = serializers.PrimaryKeyRelatedField(
        queryset=Videojuego.objects.all(), source='videojuego', write_only=True
    )
    cantidad_comentarios = serializers.SerializerMethodField()
    ultima_actividad = serializers.SerializerMethodField()

    class Meta:
        model = Topico
        fields = ['id', 'usuario', 'usuario_nombre', 'videojuego', 'videojuego_id', 'titulo', 'texto',
                  'creado', 'editado', 'cantidad_comentarios', 'ultima_actividad']
        read_only_fields = ['creado', 'editado']

    def get_cantidad_comentarios(self, obj):
        return obj.comentarios.count()

    def get_ultima_actividad(self, obj):
        # La fecha del último comentario; si no tiene, la del tópico
        ultimo = obj.comentarios.order_by('-creado').first()
        return (ultimo.creado if ultimo else obj.creado)

    def validate_titulo(self, valor):
        valor = valor.strip()
        if len(valor) < 5:
            raise serializers.ValidationError('El título tiene que tener al menos 5 caracteres.')
        return valor

    def validate_texto(self, valor):
        valor = valor.strip()
        if len(valor) < 10:
            raise serializers.ValidationError('El texto tiene que tener al menos 10 caracteres.')
        return valor

    def update(self, instance, validated_data):
        # CU14: al editar cambian título y texto (el autor y el juego quedan fijos)
        validated_data.pop('usuario', None)
        validated_data.pop('videojuego', None)
        return super().update(instance, validated_data)


class TopicoDetalleSerializer(TopicoSerializer):
    """Para la página del tópico: igual que el de arriba, más los comentarios principales con sus respuestas."""
    comentarios = serializers.SerializerMethodField()

    class Meta(TopicoSerializer.Meta):
        fields = TopicoSerializer.Meta.fields + ['comentarios']

    def get_comentarios(self, obj):
        principales = (obj.comentarios.filter(respuesta_a__isnull=True)
                       .select_related('usuario').prefetch_related('respuestas__usuario'))
        return ComentarioSerializer(principales, many=True).data
