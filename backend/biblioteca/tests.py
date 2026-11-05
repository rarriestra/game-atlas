from django.contrib.auth.models import User
from django.test import TestCase

from catalogo_videojuegos.models import Videojuego


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
