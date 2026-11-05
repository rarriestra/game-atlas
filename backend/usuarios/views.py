from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from biblioteca.models import BibliotecaItem, Resena
from comunidad.models import Topico
from .models import Seguimiento
from .serializers import PerfilSerializer, UsuarioSerializer


class UsuarioView(APIView):
    # Solo lectura: los usuarios se crean desde /admin
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            result = get_object_or_404(User, id=id)
            # NUEVO (Guía 10): el perfil trae seguidores, siguiendo y si "yo" ya lo sigo
            serializer = PerfilSerializer(result, context={'yo': request.query_params.get('yo')})
            return Response({'status': 'success', 'data': serializer.data})
        # Incluye también a los admin: antes is_staff=False los dejaba afuera (el del createsuperuser)
        result = User.objects.filter(is_active=True).order_by('username')
        serializer = UsuarioSerializer(result, many=True)
        return Response({'status': 'success', 'data': serializer.data})


class SeguirView(APIView):
    # CU19 y CU20: POST /api/usuarios/5/seguir/  con  {"seguidor": 2}
    # Interruptor, igual que el like: si no lo seguía, lo sigue; si ya lo seguía, lo deja de seguir
    def post(self, request, id):
        seguido = get_object_or_404(User, id=id)
        seguidor_id = request.data.get('seguidor')
        if not seguidor_id:
            return Response({'status': 'error', 'data': 'Falta el seguidor'}, status=status.HTTP_400_BAD_REQUEST)
        if int(seguidor_id) == seguido.id:
            return Response({'status': 'error', 'data': 'No podés seguirte a vos mismo'},
                            status=status.HTTP_400_BAD_REQUEST)
        existente = Seguimiento.objects.filter(seguidor_id=seguidor_id, seguido=seguido).first()
        if existente:
            existente.delete()       # CU20: dejar de seguir
            lo_sigo = False
        else:
            Seguimiento.objects.create(seguidor_id=seguidor_id, seguido=seguido)   # CU19: seguir
            lo_sigo = True
        return Response({'status': 'success', 'data': {'lo_sigo': lo_sigo, 'seguidores': seguido.seguidores.count()}})


class ListaSeguimientoView(APIView):
    # GET /api/usuarios/5/seguidores/   y   GET /api/usuarios/5/siguiendo/
    # El tipo de lista llega por la URL (ver urls.py: kwargs={'lista': ...})
    def get(self, request, id, lista):
        usuario = get_object_or_404(User, id=id)
        if lista == 'seguidores':
            usuarios = User.objects.filter(siguiendo__seguido=usuario)   # los que lo siguen
        else:
            usuarios = User.objects.filter(seguidores__seguidor=usuario)  # a los que sigue
        serializer = UsuarioSerializer(usuarios.order_by('username'), many=True)
        return Response({'status': 'success', 'data': serializer.data})


class ActividadView(APIView):
    """CU03 y CU21: el feed. Junta reseñas, cambios de biblioteca y tópicos, ordenados por fecha.
    GET /api/actividad/            → toda la comunidad (CU03, feed general)
    GET /api/actividad/?usuario=2  → solo la gente que sigue el usuario 2 (CU21)"""

    def get(self, request):
        usuario = request.query_params.get('usuario')
        resenas = Resena.objects.select_related('usuario', 'videojuego')
        biblioteca = BibliotecaItem.objects.select_related('usuario', 'videojuego')
        topicos = Topico.objects.select_related('usuario', 'videojuego')
        if usuario:
            # Los ids de las personas que sigue (una lista de números)
            seguidos = Seguimiento.objects.filter(seguidor_id=usuario).values_list('seguido_id', flat=True)
            resenas = resenas.filter(usuario_id__in=seguidos)
            biblioteca = biblioteca.filter(usuario_id__in=seguidos)
            topicos = topicos.filter(usuario_id__in=seguidos)

        actividad = []
        for r in resenas.order_by('-creada')[:20]:
            actividad.append(self.item('resena', r.usuario, r.videojuego, r.creada, r.texto[:200], r.id))
        for b in biblioteca.order_by('-actualizado')[:20]:
            if b.puntaje:
                texto = f'lo calificó con {b.puntaje}/10'
            else:
                texto = f'lo agregó como {b.get_estado_display()}'   # get_<campo>_display: el texto lindo del choice
            actividad.append(self.item('biblioteca', b.usuario, b.videojuego, b.actualizado, texto, b.id))
        for t in topicos.order_by('-creado')[:20]:
            actividad.append(self.item('topico', t.usuario, t.videojuego, t.creado, t.titulo, t.id))

        # Se juntan las tres listas y se ordenan por fecha, de la más nueva a la más vieja
        actividad.sort(key=lambda a: a['fecha'], reverse=True)
        return Response({'status': 'success', 'data': actividad[:20]})

    def item(self, tipo, usuario, videojuego, fecha, texto, id):
        """Arma un elemento del feed con siempre la misma forma, venga de donde venga."""
        return {
            'tipo': tipo,
            'id': id,
            'usuario': usuario.id,
            'usuario_nombre': usuario.username,
            'videojuego': {'id': videojuego.id, 'titulo': videojuego.titulo, 'portada_url': videojuego.portada_url},
            'texto': texto,
            'fecha': fecha,
        }
