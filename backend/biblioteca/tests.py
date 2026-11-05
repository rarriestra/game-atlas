from django.contrib.auth.models import User
from django.test import TestCase

from catalogo_videojuegos.models import Videojuego
from .models import BibliotecaItem, Resena


class BibliotecaApiTests(TestCase):
    def setUp(self):
        self.ana = User.objects.create(username='ana')
        self.beto = User.objects.create(username='beto')
        self.juego = Videojuego.objects.create(titulo='Hades')

    def agregar(self, usuario, estado, puntaje=None):
        datos = {'usuario': usuario.id, 'videojuego_id': self.juego.id, 'estado': estado}
        if puntaje is not None:
            datos['puntaje'] = puntaje
        return self.client.post('/api/biblioteca/', datos, content_type='application/json')

    def test_agregar_juego_con_estado(self):
        r = self.agregar(self.ana, 'JUGANDO')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()['data']['videojuego']['titulo'], 'Hades')

    def test_no_se_puede_agregar_dos_veces(self):
        self.agregar(self.ana, 'JUGANDO')
        self.assertEqual(self.agregar(self.ana, 'COMPLETADO').status_code, 400)

    def test_pendiente_no_se_puede_calificar(self):
        self.assertEqual(self.agregar(self.ana, 'PENDIENTE', puntaje=8).status_code, 400)

    def test_puntaje_fuera_de_rango(self):
        self.assertEqual(self.agregar(self.ana, 'COMPLETADO', puntaje=11).status_code, 400)

    def test_pasar_a_pendiente_conserva_el_puntaje(self):
        item_id = self.agregar(self.ana, 'COMPLETADO', puntaje=9).json()['data']['id']
        r = self.client.patch(f'/api/biblioteca/{item_id}/', {'estado': 'PENDIENTE'}, content_type='application/json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['data']['puntaje'], 9)

    def test_en_pendiente_no_se_puede_cambiar_el_puntaje(self):
        item_id = self.agregar(self.ana, 'COMPLETADO', puntaje=9).json()['data']['id']
        self.client.patch(f'/api/biblioteca/{item_id}/', {'estado': 'PENDIENTE'}, content_type='application/json')
        r = self.client.patch(f'/api/biblioteca/{item_id}/', {'puntaje': 5}, content_type='application/json')
        self.assertEqual(r.status_code, 400)

    def test_filtrar_por_usuario(self):
        self.agregar(self.ana, 'JUGANDO')
        self.agregar(self.beto, 'PENDIENTE')
        datos = self.client.get(f'/api/biblioteca/?usuario={self.ana.id}').json()['data']
        self.assertEqual(len(datos), 1)
        self.assertEqual(datos[0]['usuario'], self.ana.id)

    def test_promedio_en_la_ficha_del_juego(self):
        self.agregar(self.ana, 'COMPLETADO', puntaje=10)
        self.agregar(self.beto, 'JUGANDO', puntaje=7)
        juego = self.client.get(f'/api/videojuegos/{self.juego.id}/').json()['data']
        self.assertEqual(juego['puntaje_promedio'], 8.5)
        self.assertEqual(juego['cantidad_puntajes'], 2)


class ResenaApiTests(TestCase):
    def setUp(self):
        self.ana = User.objects.create(username='ana')
        self.juego = Videojuego.objects.create(titulo='Hades')
        self.texto = 'Un roguelike excelente, muy rejugable.'

    def calificar(self, puntaje):
        self.client.post('/api/biblioteca/', {
            'usuario': self.ana.id, 'videojuego_id': self.juego.id, 'estado': 'COMPLETADO', 'puntaje': puntaje
        }, content_type='application/json')

    def resenar(self, texto=None):
        return self.client.post('/api/resenas/', {
            'usuario': self.ana.id, 'videojuego_id': self.juego.id, 'texto': texto or self.texto
        }, content_type='application/json')

    def test_sin_calificar_no_se_puede_resenar(self):
        self.assertEqual(self.resenar().status_code, 400)

    def test_crear_resena_con_puntaje(self):
        self.calificar(9)
        r = self.resenar()
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.json()['data']['puntaje'], 9)
        self.assertEqual(r.json()['data']['usuario_nombre'], 'ana')

    def test_una_sola_resena_por_juego(self):
        self.calificar(9)
        self.resenar()
        self.assertEqual(self.resenar().status_code, 400)

    def test_texto_muy_corto(self):
        self.calificar(9)
        self.assertEqual(self.resenar('Buenísimo').status_code, 400)

    def test_editar_y_eliminar(self):
        self.calificar(9)
        id = self.resenar().json()['data']['id']
        r = self.client.patch(f'/api/resenas/{id}/', {'texto': 'Cambié de opinión: es una obra maestra.'},
                              content_type='application/json')
        self.assertEqual(r.status_code, 200)
        self.assertIn('obra maestra', r.json()['data']['texto'])
        self.assertEqual(self.client.delete(f'/api/resenas/{id}/').status_code, 200)
        self.assertEqual(self.client.get(f'/api/resenas/?videojuego={self.juego.id}').json()['data'], [])

    def test_filtros_y_limite(self):
        self.calificar(9)
        self.resenar()
        self.assertEqual(len(self.client.get(f'/api/resenas/?usuario={self.ana.id}').json()['data']), 1)
        self.assertEqual(len(self.client.get('/api/resenas/?limite=0').json()['data']), 0)


class LikesYRespuestasTests(TestCase):
    def setUp(self):
        self.ana = User.objects.create(username='ana')
        self.beto = User.objects.create(username='beto')
        juego = Videojuego.objects.create(titulo='Hades')
        BibliotecaItem.objects.create(usuario=self.ana, videojuego=juego, estado='COMPLETADO', puntaje=9)
        self.resena = Resena.objects.create(usuario=self.ana, videojuego=juego, texto='Un roguelike excelente.')
        self.juego = juego

    def like(self, usuario):
        return self.client.post(f'/api/resenas/{self.resena.id}/like/', {'usuario': usuario.id},
                                content_type='application/json')

    def test_like_funciona_como_interruptor(self):
        r = self.like(self.beto).json()['data']
        self.assertEqual((r['likes'], r['me_gusta']), (1, True))
        r = self.like(self.beto).json()['data']
        self.assertEqual((r['likes'], r['me_gusta']), (0, False))

    def test_no_se_puede_dar_like_a_la_propia(self):
        self.assertEqual(self.like(self.ana).status_code, 400)

    def test_me_gusta_depende_de_quien_mira(self):
        self.like(self.beto)
        url = f'/api/resenas/?videojuego={self.juego.id}'
        self.assertTrue(self.client.get(f'{url}&yo={self.beto.id}').json()['data'][0]['me_gusta'])
        self.assertFalse(self.client.get(f'{url}&yo={self.ana.id}').json()['data'][0]['me_gusta'])

    def test_responder_y_borrar_respuesta(self):
        r = self.client.post(f'/api/resenas/{self.resena.id}/respuestas/', {'usuario': self.beto.id, 'texto': 'Coincido!'},
                             content_type='application/json')
        self.assertEqual(r.status_code, 201)
        resena = self.client.get(f'/api/resenas/{self.resena.id}/').json()['data']
        self.assertEqual(resena['respuestas'][0]['usuario_nombre'], 'beto')
        self.assertEqual(self.client.delete(f"/api/respuestas/{r.json()['data']['id']}/").status_code, 200)

    def test_orden_por_mas_votadas(self):
        otra = Resena.objects.create(usuario=self.beto, videojuego=self.juego, texto='Muy bueno, lo recomiendo.')
        self.client.post(f'/api/resenas/{otra.id}/like/', {'usuario': self.ana.id}, content_type='application/json')
        datos = self.client.get(f'/api/resenas/?videojuego={self.juego.id}&orden=votadas').json()['data']
        self.assertEqual(datos[0]['id'], otra.id)
