from django.contrib.auth.models import User
from django.test import TestCase

from catalogo_videojuegos.models import Videojuego
from .models import Comentario, Topico


class ForoTests(TestCase):
    def setUp(self):
        self.ana = User.objects.create(username='ana')
        self.beto = User.objects.create(username='beto')
        self.juego = Videojuego.objects.create(titulo='Hades')

    def crear_topico(self, titulo='¿Mejor arma para empezar?'):
        return self.client.post('/api/topicos/', {
            'usuario': self.ana.id, 'videojuego_id': self.juego.id, 'titulo': titulo,
            'texto': 'Estoy arrancando y no sé cuál elegir.'
        }, content_type='application/json')

    def comentar(self, topico_id, texto, respuesta_a=None):
        datos = {'usuario': self.beto.id, 'texto': texto}
        if respuesta_a:
            datos['respuesta_a'] = respuesta_a
        return self.client.post(f'/api/topicos/{topico_id}/comentarios/', datos, content_type='application/json')

    def test_crear_y_listar_topicos_de_un_juego(self):
        self.assertEqual(self.crear_topico().status_code, 201)
        datos = self.client.get(f'/api/topicos/?videojuego={self.juego.id}').json()['data']
        self.assertEqual(datos[0]['titulo'], '¿Mejor arma para empezar?')
        self.assertEqual(datos[0]['cantidad_comentarios'], 0)

    def test_titulo_muy_corto(self):
        self.assertEqual(self.crear_topico('Hola').status_code, 400)

    def test_comentarios_y_respuestas_en_un_solo_nivel(self):
        topico_id = self.crear_topico().json()['data']['id']
        c1 = self.comentar(topico_id, 'La espada, sin dudas.').json()['data']['id']
        r1 = self.comentar(topico_id, 'Coincido con la espada.', respuesta_a=c1).json()['data']['id']
        # Responder a una respuesta: queda colgada del comentario principal
        r2 = self.comentar(topico_id, 'Yo también.', respuesta_a=r1).json()['data']
        self.assertEqual(r2['respuesta_a'], c1)
        detalle = self.client.get(f'/api/topicos/{topico_id}/').json()['data']
        self.assertEqual(len(detalle['comentarios']), 1)              # un comentario principal
        self.assertEqual(len(detalle['comentarios'][0]['respuestas']), 2)  # con dos respuestas
        self.assertEqual(detalle['cantidad_comentarios'], 3)

    def test_no_se_responde_a_un_comentario_de_otro_topico(self):
        t1 = self.crear_topico().json()['data']['id']
        t2 = self.crear_topico('Otro tópico distinto').json()['data']['id']
        c1 = self.comentar(t1, 'Comentario en el primero.').json()['data']['id']
        self.assertEqual(self.comentar(t2, 'Respuesta cruzada.', respuesta_a=c1).status_code, 400)

    def test_editar_y_eliminar(self):
        topico_id = self.crear_topico().json()['data']['id']
        c1 = self.comentar(topico_id, 'Texto original.').json()['data']['id']
        r = self.client.patch(f'/api/comentarios/{c1}/', {'texto': 'Texto editado.'}, content_type='application/json')
        self.assertEqual(r.json()['data']['texto'], 'Texto editado.')
        self.client.delete(f'/api/topicos/{topico_id}/')
        self.assertFalse(Comentario.objects.exists())  # borrar el tópico borra sus comentarios
