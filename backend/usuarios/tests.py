from django.contrib.auth.models import User
from django.test import TestCase

from biblioteca.models import BibliotecaItem, Resena
from catalogo_videojuegos.models import Videojuego


class SeguirTests(TestCase):
    def setUp(self):
        self.ana = User.objects.create(username='ana')
        self.beto = User.objects.create(username='beto')
        self.caro = User.objects.create(username='caro')

    def seguir(self, seguidor, seguido):
        return self.client.post(f'/api/usuarios/{seguido.id}/seguir/', {'seguidor': seguidor.id},
                                content_type='application/json')

    def test_seguir_y_dejar_de_seguir(self):
        r = self.seguir(self.ana, self.beto).json()['data']
        self.assertEqual((r['lo_sigo'], r['seguidores']), (True, 1))
        r = self.seguir(self.ana, self.beto).json()['data']
        self.assertEqual((r['lo_sigo'], r['seguidores']), (False, 0))

    def test_no_se_puede_seguir_a_si_mismo(self):
        self.assertEqual(self.seguir(self.ana, self.ana).status_code, 400)

    def test_perfil_con_contadores(self):
        self.seguir(self.ana, self.beto)
        self.seguir(self.caro, self.beto)
        self.seguir(self.beto, self.ana)
        perfil = self.client.get(f'/api/usuarios/{self.beto.id}/?yo={self.ana.id}').json()['data']
        self.assertEqual((perfil['seguidores'], perfil['siguiendo'], perfil['lo_sigo']), (2, 1, True))
        lista = self.client.get(f'/api/usuarios/{self.beto.id}/seguidores/').json()['data']
        self.assertEqual([u['username'] for u in lista], ['ana', 'caro'])

    def test_feed_de_seguidos_solo_trae_a_los_que_sigo(self):
        juego = Videojuego.objects.create(titulo='Hades')
        BibliotecaItem.objects.create(usuario=self.beto, videojuego=juego, estado='COMPLETADO', puntaje=9)
        Resena.objects.create(usuario=self.beto, videojuego=juego, texto='Reseña de beto sobre Hades.')
        BibliotecaItem.objects.create(usuario=self.caro, videojuego=juego, estado='PENDIENTE')
        self.seguir(self.ana, self.beto)

        seguidos = self.client.get(f'/api/actividad/?usuario={self.ana.id}').json()['data']
        self.assertEqual({a['usuario_nombre'] for a in seguidos}, {'beto'})
        self.assertEqual({a['tipo'] for a in seguidos}, {'resena', 'biblioteca'})

        general = self.client.get('/api/actividad/').json()['data']
        self.assertEqual({a['usuario_nombre'] for a in general}, {'beto', 'caro'})
