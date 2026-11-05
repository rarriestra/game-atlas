from datetime import timedelta

from django.contrib.auth.models import User
from rest_framework import serializers

from . import contenido
from .models import Reporte, Sancion


class ReporteSerializer(serializers.ModelSerializer):
    reportante = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    reportante_nombre = serializers.CharField(source='reportante.username', read_only=True)
    autor_nombre = serializers.CharField(source='autor.username', read_only=True)
    tipo_texto = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_texto = serializers.CharField(source='get_estado_display', read_only=True)
    moderador_nombre = serializers.CharField(source='moderador.username', read_only=True, default=None)
    ubicacion = serializers.SerializerMethodField()        # dónde está (null si ya se borró)
    sanciones_autor = serializers.SerializerMethodField()  # cuántas sanciones tiene el autor

    class Meta:
        model = Reporte
        fields = ['id', 'reportante', 'reportante_nombre', 'tipo', 'tipo_texto', 'contenido_id',
                  'autor', 'autor_nombre', 'texto', 'motivo', 'estado', 'estado_texto',
                  'moderador_nombre', 'creado', 'resuelto', 'ubicacion', 'sanciones_autor']
        read_only_fields = ['autor', 'texto', 'estado', 'creado', 'resuelto']
        validators = []   # el "pendiente repetido" lo controlamos en validate(), con mensaje en castellano

    def validate_motivo(self, valor):
        valor = valor.strip()
        if not 5 <= len(valor) <= 500:
            raise serializers.ValidationError('El motivo tiene que tener entre 5 y 500 caracteres.')
        return valor

    def validate(self, attrs):
        objeto = contenido.buscar(attrs['tipo'], attrs['contenido_id'])
        if objeto is None:
            raise serializers.ValidationError('Ese contenido no existe.')
        if objeto.usuario_id == attrs['reportante'].id:
            raise serializers.ValidationError('No podés reportar tu propio contenido.')
        if Reporte.objects.filter(reportante=attrs['reportante'], tipo=attrs['tipo'],
                                  contenido_id=attrs['contenido_id'], estado=Reporte.Estado.PENDIENTE).exists():
            raise serializers.ValidationError('Ya lo reportaste. Un moderador lo va a revisar.')
        # Se completan solos: el autor del contenido y una copia de lo que decía
        attrs['autor'] = objeto.usuario
        attrs['texto'] = contenido.copiar_texto(attrs['tipo'], objeto)
        return attrs

    def get_ubicacion(self, obj):
        objeto = contenido.buscar(obj.tipo, obj.contenido_id)
        return contenido.ubicacion(obj.tipo, objeto) if objeto else None

    def get_sanciones_autor(self, obj):
        return obj.autor.sanciones.count()


class SancionSerializer(serializers.ModelSerializer):
    usuario = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    usuario_nombre = serializers.CharField(source='usuario.username', read_only=True)
    moderador_nombre = serializers.CharField(source='moderador.username', read_only=True, default=None)
    tipo_texto = serializers.CharField(source='get_tipo_display', read_only=True)
    # dias no es un campo del modelo: llega en el JSON y se usa para calcular "fin"
    dias = serializers.IntegerField(write_only=True, required=False, min_value=1, max_value=365)
    vigente = serializers.BooleanField(read_only=True)   # la @property del modelo

    class Meta:
        model = Sancion
        fields = ['id', 'usuario', 'usuario_nombre', 'tipo', 'tipo_texto', 'motivo', 'dias',
                  'reporte', 'moderador_nombre', 'inicio', 'fin', 'vigente']
        read_only_fields = ['inicio', 'fin']

    def validate(self, attrs):
        if attrs['usuario'].is_staff:
            raise serializers.ValidationError('No se puede sancionar a un moderador.')
        if attrs['tipo'] == Sancion.Tipo.SUSPENSION and not attrs.get('dias'):
            raise serializers.ValidationError({'dias': 'Indicá cuántos días dura la suspensión.'})
        return attrs

    def create(self, validated_data):
        dias = validated_data.pop('dias', None)   # se saca porque el modelo no tiene ese campo
        sancion = Sancion(**validated_data)
        if sancion.tipo == Sancion.Tipo.SUSPENSION:
            sancion.fin = sancion.inicio + timedelta(days=dias)
        sancion.save()
        return sancion
