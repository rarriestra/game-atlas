from django.db.models import Avg, Case, Count, F, IntegerField, Value, When
from django.db.models.functions import Lower
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from catalogo_videojuegos.models import Videojuego
from .models import BibliotecaItem, LikeResena, Lista, Resena, RespuestaResena
from .serializers import BibliotecaItemSerializer, ListaSerializer, ResenaSerializer, RespuestaResenaSerializer


def ordenar_biblioteca(result, ordenar):
    """Ordena por hasta dos criterios, igual que el catálogo: ordenar='mi_puntaje:desc,titulo:asc'."""
    criterios = []
    for parte in ordenar.split(',')[:2]:
        campo, _, direccion = parte.partition(':')
        if campo == 'titulo':
            columna = Lower('videojuego__titulo')
        elif campo == 'promedio':
            # El promedio de todos los usuarios, no solo del dueño de esta biblioteca
            result = result.annotate(orden_promedio=Avg('videojuego__en_bibliotecas__puntaje'))
            columna = F('orden_promedio')
        elif campo == 'mi_puntaje':
            columna = F('puntaje')
        elif campo == 'estado':
            # Orden lógico en vez de alfabético: lo que estás jugando primero
            result = result.annotate(
                orden_estado=Case(
                    When(estado=BibliotecaItem.Estado.JUGANDO, then=Value(1)),
                    When(estado=BibliotecaItem.Estado.COMPLETADO, then=Value(2)),
                    When(estado=BibliotecaItem.Estado.PENDIENTE, then=Value(3)),
                    When(estado=BibliotecaItem.Estado.ABANDONADO, then=Value(4)),
                    output_field=IntegerField(),
                )
            )
            columna = F('orden_estado')
        else:
            continue  # un campo que no conocemos se ignora
        # nulls_last: los juegos sin dato van siempre al final, sea ascendente o descendente
        criterios.append(columna.desc(nulls_last=True) if direccion == 'desc' else columna.asc(nulls_last=True))

    if not criterios:
        return result
    return result.order_by(*criterios, 'videojuego__titulo', 'id')


class BibliotecaView(APIView):
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            item = get_object_or_404(BibliotecaItem, id=id)
            return Response({'status': 'success', 'data': BibliotecaItemSerializer(item).data})

        # select_related trae el juego en la misma consulta (si no, haría una consulta por item)
        result = BibliotecaItem.objects.select_related('videojuego')
        usuario = request.query_params.get('usuario')
        videojuego = request.query_params.get('videojuego')
        estado = request.query_params.get('estado')
        if usuario:
            result = result.filter(usuario_id=usuario)
        if videojuego:
            result = result.filter(videojuego_id=videojuego)
        if estado:
            result = result.filter(estado=estado)
        # Los mismos filtros que el catálogo (acá no se importa de IGDB: solo busca en la biblioteca)
        titulo = request.query_params.get('titulo')
        genero = request.query_params.get('genero')
        idioma = request.query_params.get('idioma')
        if titulo:
            result = result.filter(videojuego__titulo__icontains=titulo)
        if genero:
            result = result.filter(videojuego__generos__id=genero)
        if idioma:
            result = result.filter(videojuego__idiomas__id=idioma)
        ordenar = request.query_params.get('ordenar')
        if ordenar:
            result = ordenar_biblioteca(result, ordenar)
        serializer = BibliotecaItemSerializer(result, many=True)
        return Response({'status': 'success', 'data': serializer.data})

    def post(self, request):
        serializer = BibliotecaItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, id):
        item = get_object_or_404(BibliotecaItem, id=id)
        serializer = BibliotecaItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data})
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        item = get_object_or_404(BibliotecaItem, id=id)
        item.delete()
        return Response({'status': 'success', 'data': 'Record Deleted'})


class ResenaView(APIView):
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            resena = get_object_or_404(Resena, id=id)
            return Response({'status': 'success', 'data': ResenaSerializer(resena).data})

        # annotate agrega a cada reseña un campo calculado: cuántos likes tiene
        result = (Resena.objects.select_related('usuario', 'videojuego')
                  .prefetch_related('respuestas__usuario')
                  .annotate(cantidad_likes=Count('likes')))
        if request.query_params.get('orden') == 'votadas':
            result = result.order_by('-cantidad_likes', '-creada')  # NUEVO: las más votadas primero
        videojuego = request.query_params.get('videojuego')  # reseñas de un juego (ficha)
        usuario = request.query_params.get('usuario')        # reseñas de un usuario (perfil)
        if videojuego:
            result = result.filter(videojuego_id=videojuego)
        if usuario:
            result = result.filter(usuario_id=usuario)
        limite = request.query_params.get('limite')          # las últimas N (inicio)
        if limite and limite.isdigit():
            result = result[:int(limite)]
        # context: datos extra para el serializer. 'yo' = quién mira, para calcular me_gusta
        serializer = ResenaSerializer(result, many=True, context={'yo': request.query_params.get('yo')})
        return Response({'status': 'success', 'data': serializer.data})

    def post(self, request):
        serializer = ResenaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, id):
        resena = get_object_or_404(Resena, id=id)
        serializer = ResenaSerializer(resena, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data})
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        resena = get_object_or_404(Resena, id=id)
        resena.delete()
        return Response({'status': 'success', 'data': 'Record Deleted'})


class LikeResenaView(APIView):
    # POST /api/resenas/5/like/  con  {"usuario": 2}
    # Funciona como un interruptor: si no tenía like lo agrega; si ya lo tenía, lo saca
    def post(self, request, id):
        resena = get_object_or_404(Resena, id=id)
        usuario_id = request.data.get('usuario')
        if not usuario_id:
            return Response({'status': 'error', 'data': 'Falta el usuario'}, status=status.HTTP_400_BAD_REQUEST)
        if int(usuario_id) == resena.usuario_id:
            return Response({'status': 'error', 'data': 'No podés darle like a tu propia reseña'},
                            status=status.HTTP_400_BAD_REQUEST)
        like = LikeResena.objects.filter(resena=resena, usuario_id=usuario_id).first()
        if like:
            like.delete()
            me_gusta = False
        else:
            LikeResena.objects.create(resena=resena, usuario_id=usuario_id)
            me_gusta = True
        return Response({'status': 'success', 'data': {'likes': resena.likes.count(), 'me_gusta': me_gusta}})


class RespuestasDeResenaView(APIView):
    # POST /api/resenas/5/respuestas/  con  {"usuario": 2, "texto": "..."}
    def post(self, request, id):
        resena = get_object_or_404(Resena, id=id)
        serializer = RespuestaResenaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(resena=resena)  # save(...) agrega datos que no vinieron en el JSON
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class RespuestaView(APIView):
    # DELETE /api/respuestas/8/
    def delete(self, request, id):
        respuesta = get_object_or_404(RespuestaResena, id=id)
        respuesta.delete()
        return Response({'status': 'success', 'data': 'Record Deleted'})


class ListaView(APIView):
    # CU09 a CU11: el ABM de listas personales
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        # prefetch_related trae los juegos de todas las listas en UNA consulta más (para muchos a muchos)
        result = Lista.objects.select_related('usuario').prefetch_related('videojuegos')
        if id:
            lista = get_object_or_404(result, id=id)
            return Response({'status': 'success', 'data': ListaSerializer(lista).data})
        usuario = request.query_params.get('usuario')   # las listas de un usuario (perfil y ficha)
        if usuario:
            result = result.filter(usuario_id=usuario)
        serializer = ListaSerializer(result, many=True)
        return Response({'status': 'success', 'data': serializer.data})

    def post(self, request):
        serializer = ListaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data}, status=status.HTTP_201_CREATED)
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, id):
        lista = get_object_or_404(Lista, id=id)
        serializer = ListaSerializer(lista, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data})
        return Response({'status': 'error', 'data': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id):
        lista = get_object_or_404(Lista, id=id)
        lista.delete()   # borra la lista y sus filas de la tabla intermedia; los juegos quedan
        return Response({'status': 'success', 'data': 'Record Deleted'})


class ListaJuegoView(APIView):
    # POST /api/listas/3/videojuegos/  con  {"videojuego": 5}
    # Interruptor, como el like: si el juego no estaba lo agrega; si estaba, lo saca (CU10)
    def post(self, request, id):
        lista = get_object_or_404(Lista, id=id)
        videojuego_id = request.data.get('videojuego')
        if not videojuego_id:
            return Response({'status': 'error', 'data': 'Falta el videojuego'}, status=status.HTTP_400_BAD_REQUEST)
        videojuego = get_object_or_404(Videojuego, id=videojuego_id)
        if lista.videojuegos.filter(id=videojuego.id).exists():
            lista.videojuegos.remove(videojuego)   # borra la fila de la tabla intermedia
            en_lista = False
        else:
            lista.videojuegos.add(videojuego)      # crea la fila en la tabla intermedia
            en_lista = True
        lista.save()   # actualiza "actualizada", así la lista sube al principio
        return Response({'status': 'success', 'data': {'en_lista': en_lista, 'cantidad': lista.videojuegos.count()}})
