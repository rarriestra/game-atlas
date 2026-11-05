from io import StringIO
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase

from biblioteca.models import BibliotecaItem
from .igdb import guardar_juego
from .models import Genero, Idioma, Plataforma, Videojuego
from .serializers import VideojuegoSerializer


class OrdenCatalogoTests(TestCase):
    def setUp(self):
        self.ana = User.objects.create(username='ana')
        self.beto = User.objects.create(username='beto')
        self.a = Videojuego.objects.create(titulo='alfa')    # minúscula a propósito
        self.b = Videojuego.objects.create(titulo='Bravo')
        self.c = Videojuego.objects.create(titulo='Charlie')
        self.d = Videojuego.objects.create(titulo='Delta')   # nadie lo tiene ni lo calificó
        crear = BibliotecaItem.objects.create
        crear(usuario=self.ana, videojuego=self.a, estado='PENDIENTE')
        crear(usuario=self.ana, videojuego=self.b, estado='COMPLETADO', puntaje=5)
        crear(usuario=self.ana, videojuego=self.c, estado='JUGANDO', puntaje=9)
        crear(usuario=self.beto, videojuego=self.b, estado='JUGANDO', puntaje=10)  # promedio de Bravo: 7.5
        crear(usuario=self.beto, videojuego=self.c, estado='JUGANDO', puntaje=1)   # promedio de Charlie: 5

    def titulos(self, ordenar, usuario=None):
        url = f'/api/videojuegos/?ordenar={ordenar}'
        if usuario:
            url += f'&usuario={usuario.id}'
        return [j['titulo'] for j in self.client.get(url).json()['data']]

    def test_nombre_sin_importar_mayusculas(self):
        self.assertEqual(self.titulos('titulo:asc'), ['alfa', 'Bravo', 'Charlie', 'Delta'])
        self.assertEqual(self.titulos('titulo:desc'), ['Delta', 'Charlie', 'Bravo', 'alfa'])

    def test_puntaje_general_con_los_sin_puntaje_al_final(self):
        self.assertEqual(self.titulos('promedio:desc'), ['Bravo', 'Charlie', 'alfa', 'Delta'])
        self.assertEqual(self.titulos('promedio:asc'), ['Charlie', 'Bravo', 'alfa', 'Delta'])

    def test_mi_puntaje_depende_del_usuario(self):
        self.assertEqual(self.titulos('mi_puntaje:desc', self.ana), ['Charlie', 'Bravo', 'alfa', 'Delta'])
        self.assertEqual(self.titulos('mi_puntaje:desc', self.beto), ['Bravo', 'Charlie', 'alfa', 'Delta'])

    def test_estado_en_orden_logico_y_sin_estado_al_final(self):
        self.assertEqual(self.titulos('estado:asc', self.ana), ['Charlie', 'Bravo', 'alfa', 'Delta'])
        self.assertEqual(self.titulos('estado:desc', self.ana), ['alfa', 'Bravo', 'Charlie', 'Delta'])

    def test_orden_secundario_desempata(self):
        self.assertEqual(self.titulos('estado:asc,titulo:desc', self.beto), ['Charlie', 'Bravo', 'Delta', 'alfa'])
        self.assertEqual(self.titulos('estado:asc,promedio:desc', self.beto), ['Bravo', 'Charlie', 'alfa', 'Delta'])

    def test_sin_usuario_o_campo_desconocido_no_falla(self):
        nombres = ['alfa', 'Bravo', 'Charlie', 'Delta']
        self.assertCountEqual(self.titulos('mi_puntaje:desc'), nombres)
        self.assertCountEqual(self.titulos('estado:asc'), nombres)
        self.assertCountEqual(self.titulos('inventado:desc'), nombres)
        r = self.client.get('/api/videojuegos/?ordenar=estado:asc&usuario=abc')
        self.assertEqual(r.status_code, 200)

    def test_combina_con_filtros_y_paginacion_sin_alterar_el_promedio(self):
        genero = Genero.objects.create(nombre='Rol')
        self.b.generos.add(genero)
        self.c.generos.add(genero)
        r = self.client.get(f'/api/videojuegos/?ordenar=promedio:desc&genero={genero.id}&page=1&page_size=1').json()
        self.assertEqual(r['count'], 2)
        self.assertEqual(r['pages'], 2)
        self.assertEqual(r['data'][0]['titulo'], 'Bravo')
        self.assertEqual(r['data'][0]['puntaje_promedio'], 7.5)


def soporte(nombre):
    """Un idioma tal como lo manda IGDB dentro de language_supports."""
    return {'language': {'name': nombre}}


class IdiomasTests(TestCase):
    def test_importar_traduce_unifica_y_no_repite(self):
        juego = {'id': 1, 'name': 'Hades', 'language_supports': [
            soporte('Spanish (Spain)'), soporte('Spanish (Mexico)'),  # dos variantes: un solo Español
            soporte('English'), soporte('English'),                   # audio y subtítulos: un solo Inglés
            soporte('Klingon'),                                       # sin traducción: queda como viene
        ]}
        videojuego, creado = guardar_juego(juego)
        self.assertTrue(creado)
        self.assertEqual(sorted(i.nombre for i in videojuego.idiomas.all()), ['Español', 'Inglés', 'Klingon'])

    def test_importar_sin_idiomas_no_falla(self):
        videojuego, _ = guardar_juego({'id': 1, 'name': 'Hades'})
        self.assertEqual(videojuego.idiomas.count(), 0)

    def test_juego_existente_completa_idiomas_sin_pisar_lo_demas(self):
        Videojuego.objects.create(igdb_id=1, titulo='Corregido por el admin')
        videojuego, creado = guardar_juego({'id': 1, 'name': 'Otro', 'language_supports': [soporte('French')]})
        self.assertFalse(creado)
        self.assertEqual(videojuego.titulo, 'Corregido por el admin')
        self.assertEqual([i.nombre for i in videojuego.idiomas.all()], ['Francés'])

    def test_filtrar_por_idioma_combinado_con_genero(self):
        espanol = Idioma.objects.create(nombre='Español')
        ingles = Idioma.objects.create(nombre='Inglés')
        rol = Genero.objects.create(nombre='Rol')
        a = Videojuego.objects.create(titulo='A')
        a.idiomas.set([espanol, ingles])
        a.generos.add(rol)
        b = Videojuego.objects.create(titulo='B')
        b.idiomas.add(espanol)
        Videojuego.objects.create(titulo='C sin idiomas')

        def titulos(consulta):
            return [j['titulo'] for j in self.client.get(f'/api/videojuegos/?{consulta}').json()['data']]

        self.assertEqual(titulos(f'idioma={espanol.id}'), ['A', 'B'])
        self.assertEqual(titulos(f'idioma={ingles.id}'), ['A'])
        self.assertEqual(titulos(f'idioma={espanol.id}&genero={rol.id}'), ['A'])

    def test_api_lista_idiomas_ordenados_y_la_ficha_los_incluye(self):
        z = Idioma.objects.create(nombre='Ruso')
        a = Idioma.objects.create(nombre='Alemán')
        juego = Videojuego.objects.create(titulo='A')
        juego.idiomas.add(a)
        lista = self.client.get('/api/idiomas/').json()['data']
        self.assertEqual([i['id'] for i in lista], [a.id, z.id])
        ficha = self.client.get(f'/api/videojuegos/{juego.id}/').json()['data']
        self.assertEqual(ficha['idiomas'], [{'id': a.id, 'nombre': 'Alemán'}])

    def test_editar_un_juego_no_borra_sus_idiomas(self):
        juego = Videojuego.objects.create(titulo='A')
        juego.idiomas.add(Idioma.objects.create(nombre='Inglés'))
        r = self.client.patch(f'/api/videojuegos/{juego.id}/', {'titulo': 'B', 'idiomas': []},
                              content_type='application/json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(juego.idiomas.count(), 1)

    def test_comando_completa_solo_los_que_faltan(self):
        pendiente = Videojuego.objects.create(igdb_id=1, titulo='Pendiente')
        ya_tiene = Videojuego.objects.create(igdb_id=2, titulo='Ya tiene')
        ya_tiene.idiomas.add(Idioma.objects.create(nombre='Ruso'))
        Videojuego.objects.create(titulo='Cargado a mano')  # sin igdb_id: no se consulta

        ruta = 'catalogo_videojuegos.management.commands.importar_idiomas.buscar_idiomas'
        with patch(ruta, return_value=[{'id': 1, 'language_supports': [soporte('German')]}]) as buscar:
            call_command('importar_idiomas', stdout=StringIO())
        buscar.assert_called_once_with([1])
        self.assertEqual([i.nombre for i in pendiente.idiomas.all()], ['Alemán'])


class VideojuegoSerializerTests(TestCase):
    def test_create_accepts_relation_id_fields(self):
        genero = Genero.objects.create(nombre='Aventura')
        plataforma = Plataforma.objects.create(nombre='PC')

        serializer = VideojuegoSerializer(data={
            'titulo': 'Juego de prueba',
            'generos_ids': [genero.pk],
            'plataformas_ids': [plataforma.pk],
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        videojuego = serializer.save()

        self.assertEqual(list(videojuego.generos.all()), [genero])
        self.assertEqual(list(videojuego.plataformas.all()), [plataforma])
        self.assertEqual(serializer.data['generos'], [{'id': genero.pk, 'nombre': 'Aventura'}])
        self.assertEqual(serializer.data['plataformas'], [{'id': plataforma.pk, 'nombre': 'PC'}])

    def test_update_changes_only_provided_relations(self):
        genero_original = Genero.objects.create(nombre='Aventura')
        genero_nuevo = Genero.objects.create(nombre='Rol')
        plataforma = Plataforma.objects.create(nombre='PC')
        videojuego = Videojuego.objects.create(titulo='Juego de prueba')
        videojuego.generos.add(genero_original)
        videojuego.plataformas.add(plataforma)

        serializer = VideojuegoSerializer(
            videojuego,
            data={'generos_ids': [genero_nuevo.pk]},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        videojuego = serializer.save()

        self.assertEqual(list(videojuego.generos.all()), [genero_nuevo])
        self.assertEqual(list(videojuego.plataformas.all()), [plataforma])
