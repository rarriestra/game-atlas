from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .igdb import buscar_juegos, guardar_juego, importar_si_hace_falta
from .models import Genero, Idioma, Plataforma, Videojuego
from .serializers import VideojuegoSerializer, PlataformaSerializer, GeneroSerializer, IdiomaSerializer
from django.core.paginator import Paginator
from django.db.models import Avg, Case, F, IntegerField, OuterRef, Subquery, Value, When
from django.db.models.functions import Lower
from biblioteca.models import BibliotecaItem


def ordenar_catalogo(result, ordenar, usuario):
    """Ordena por hasta dos criterios, por ejemplo ordenar='mi_puntaje:desc,titulo:asc'.
    mi_puntaje y estado dependen de un usuario: sin usuario, se ignoran."""
    # La fila de la biblioteca de ese usuario para cada juego (OuterRef = el juego de la consulta de afuera)
    mio = None
    if usuario and usuario.isdigit():
        mio = BibliotecaItem.objects.filter(usuario_id=usuario, videojuego=OuterRef('pk'))

    criterios = []
    for parte in ordenar.split(',')[:2]:
        campo, _, direccion = parte.partition(':')
        if campo == 'titulo':
            columna = Lower('titulo')  # así las minúsculas no quedan separadas de las mayúsculas
        elif campo == 'promedio':
            result = result.annotate(orden_promedio=Avg('en_bibliotecas__puntaje'))
            columna = F('orden_promedio')
        elif campo == 'mi_puntaje' and mio is not None:
            result = result.annotate(orden_mi_puntaje=Subquery(mio.values('puntaje')[:1]))
            columna = F('orden_mi_puntaje')
        elif campo == 'estado' and mio is not None:
            # Orden lógico en vez de alfabético: lo que estás jugando primero
            result = result.annotate(mi_estado=Subquery(mio.values('estado')[:1])).annotate(
                orden_estado=Case(
                    When(mi_estado=BibliotecaItem.Estado.JUGANDO, then=Value(1)),
                    When(mi_estado=BibliotecaItem.Estado.COMPLETADO, then=Value(2)),
                    When(mi_estado=BibliotecaItem.Estado.PENDIENTE, then=Value(3)),
                    When(mi_estado=BibliotecaItem.Estado.ABANDONADO, then=Value(4)),
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
    # titulo e id desempatan: sin esto, un juego empatado podría repetirse o perderse entre páginas
    return result.order_by(*criterios, 'titulo', 'id')


class VideojuegoView(APIView):
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            result = get_object_or_404(Videojuego, id=id)
            serializer = VideojuegoSerializer(result)
            return Response(
                {'status': 'success', 'data': serializer.data},
                status=status.HTTP_200_OK
            )
        result = Videojuego.objects.all().order_by('titulo')
        if request.query_params.get('orden') == 'recientes':
            result = result.order_by('-id')  # NUEVO: los últimos agregados primero (para el inicio)
        titulo = request.query_params.get('titulo')
        if titulo and len(titulo.strip()) >= 3:
            importar_si_hace_falta(titulo)  # antes de buscar en la base, trae de IGDB lo que falte
        genero = request.query_params.get('genero')
        plataforma = request.query_params.get('plataforma')
        idioma = request.query_params.get('idioma')
        if titulo:
            result = result.filter(titulo__icontains=titulo) # i: insensitive (no case sensitive)
        if genero:
            result = result.filter(generos__id=genero)
        if plataforma:
            result = result.filter(plataformas__id=plataforma)
        if idioma:
            result = result.filter(idiomas__id=idioma)
        ordenar = request.query_params.get('ordenar')
        if ordenar:
            result = ordenar_catalogo(result, ordenar, request.query_params.get('usuario'))
                # Paginación: solo si Angular manda ?page=  (si no, devuelve todo como antes)
        page = request.query_params.get('page')
        if page:
            try:
                # entre 1 y 100 por página; si mandan algo que no es número, 10
                page_size = min(max(int(request.query_params.get('page_size', 10)), 1), 100)
            except ValueError:
                page_size = 10
            paginador = Paginator(result, page_size)   # parte el queryset en páginas
            pagina = paginador.get_page(page)          # si piden una página que no existe, da la última
            serializer = VideojuegoSerializer(pagina.object_list, many=True)
            return Response({
                'status': 'success',
                'data': serializer.data,       # solo los juegos de esta página
                'count': paginador.count,      # total de juegos (con los filtros aplicados)
                'pages': paginador.num_pages,  # cantidad de páginas
                'page': pagina.number,         # página actual
            })
        serializer = VideojuegoSerializer(result, many=True)
        return Response(
            {'status': 'success', 'data': serializer.data},
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = VideojuegoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'status': 'success', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def put(self, request, id):
        result = get_object_or_404(Videojuego, id=id)
        serializer = VideojuegoSerializer(result, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'status': 'success', 'data': serializer.data}
            )
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, id):
        result = get_object_or_404(Videojuego, id=id)
        serializer = VideojuegoSerializer(
            result,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'status': 'success', 'data': serializer.data}
            )
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, id):
        result = get_object_or_404(Videojuego, id=id)
        result.delete()
        return Response(
            {'status': 'success', 'data': 'Record Deleted'}
        )
class GeneroView(APIView):
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            result = get_object_or_404(Genero, id=id)
            serializer = GeneroSerializer(result)
            return Response({'status': 'success', 'data': serializer.data})
        result = Genero.objects.all().order_by('nombre')
        serializer = GeneroSerializer(result, many=True)
        return Response({'status': 'success', 'data': serializer.data})

    def post(self, request):
        serializer = GeneroSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'status': 'success', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, id):
        result = get_object_or_404(Genero, id=id)
        serializer = GeneroSerializer(result, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data})
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, id):
        result = get_object_or_404(Genero, id=id)
        result.delete()
        return Response({'status': 'success', 'data': 'Record Deleted'})

class IdiomaView(APIView):
    # Solo lectura: los idiomas los crea la importación de IGDB
    def get(self, request):
        result = Idioma.objects.all().order_by('nombre')
        serializer = IdiomaSerializer(result, many=True)
        return Response({'status': 'success', 'data': serializer.data})


class PlataformaView(APIView):
    def get(self, request, *args, **kwargs):
        id = kwargs.get('id', None)
        if id:
            result = get_object_or_404(Plataforma, id=id)
            serializer = PlataformaSerializer(result)
            return Response({'status': 'success', 'data': serializer.data})
        result = Plataforma.objects.all().order_by('nombre')
        serializer = PlataformaSerializer(result, many=True)
        return Response({'status': 'success', 'data': serializer.data})

    def post(self, request):
        serializer = PlataformaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'status': 'success', 'data': serializer.data},
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, id):
        result = get_object_or_404(Plataforma, id=id)
        serializer = PlataformaSerializer(result, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'status': 'success', 'data': serializer.data})
        return Response(
            {'status': 'error', 'data': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, id):
        result = get_object_or_404(Plataforma, id=id)
        result.delete()
        return Response({'status': 'success', 'data': 'Record Deleted'})
