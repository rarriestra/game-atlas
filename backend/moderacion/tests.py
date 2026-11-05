from django.contrib.auth.models import User
from django.test import TestCase

from biblioteca.models import BibliotecaItem, Resena
from catalogo_videojuegos.models import Videojuego
from comunidad.models import Comentario, Topico
from .models import Reporte, Sancion


class ModeracionTests(TestCase):
    def setUp(self):
        self.mod = User.objects.create(username='mod', is_staff=True)
        self.ana = User.objects.create(username='ana')
        self.beto = User.objects.create(username='beto')
        self.juego = Videojuego.objects.create(titulo='Hades')
        BibliotecaItem.objects.create(usuario=self.beto, videojuego=self.juego, estado='COMPLETADO', puntaje=2)
        self.resena = Resena.objects.create(usuario=self.beto, videojuego=self.juego, texto='Texto ofensivo de beto')

    def post(self, url, datos):
        return self.client.post(url, datos, content_type='application/json')

    def reportar(self, usuario, tipo='RESENA', contenido_id=None, motivo='Es ofensivo'):
        return self.post('/api/reportes/', {'reportante': usuario.id, 'tipo': tipo,
                                            'contenido_id': contenido_id or self.resena.id, 'motivo': motivo})

    # ---- CU23 ----
    def test_reportar_guarda_autor_y_copia_del_texto(self):
        r = self.reportar(self.ana)
        self.assertEqual(r.status_code, 201)
        data = r.json()['data']
        self.assertEqual((data['autor_nombre'], data['texto']), ('beto', 'Texto ofensivo de beto'))
        self.assertEqual(data['ubicacion']['videojuego']['titulo'], 'Hades')

    def test_no_se_puede_reportar_lo_propio_ni_dos_veces(self):
        self.assertEqual(self.reportar(self.beto).status_code, 400)
        self.reportar(self.ana)
        self.assertEqual(self.reportar(self.ana).status_code, 400)

    def test_contenido_inexistente_o_motivo_corto(self):
        self.assertEqual(self.reportar(self.ana, contenido_id=999).status_code, 400)
        self.assertEqual(self.reportar(self.ana, motivo='mal').status_code, 400)

    def test_reportar_topico_y_comentario(self):
        topico = Topico.objects.create(videojuego=self.juego, usuario=self.beto, titulo='Título', texto='Texto del tópico')
        comentario = Comentario.objects.create(topico=topico, usuario=self.beto, texto='Comentario')
        r = self.reportar(self.ana, 'TOPICO', topico.id).json()['data']
        self.assertEqual(r['ubicacion']['topico'], topico.id)
        self.assertIn('Título', r['texto'])
        r = self.reportar(self.ana, 'COMENTARIO', comentario.id).json()['data']
        self.assertEqual(r['ubicacion']['topico'], topico.id)

    # ---- CU24 ----
    def test_solo_el_moderador_ve_los_reportes(self):
        self.reportar(self.ana)
        self.assertEqual(self.client.get(f'/api/reportes/?moderador={self.ana.id}').status_code, 403)
        r = self.client.get(f'/api/reportes/?moderador={self.mod.id}')
        self.assertEqual(len(r.json()['data']), 1)

    # ---- CU25 ----
    def test_eliminar_borra_el_contenido_y_cierra_todos_sus_reportes(self):
        caro = User.objects.create(username='caro')
        id = self.reportar(self.ana).json()['data']['id']
        self.reportar(caro)
        r = self.post(f'/api/reportes/{id}/resolver/', {'moderador': self.mod.id, 'accion': 'eliminar'})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['data']['ubicacion'], None)   # ya no existe
        self.assertFalse(Resena.objects.filter(id=self.resena.id).exists())
        self.assertEqual(Reporte.objects.filter(estado='PENDIENTE').count(), 0)
        historial = self.client.get(f'/api/reportes/?moderador={self.mod.id}&estado=resueltos').json()['data']
        self.assertEqual(len(historial), 2)

    def test_descartar_deja_el_contenido(self):
        id = self.reportar(self.ana).json()['data']['id']
        self.assertEqual(self.post(f'/api/reportes/{id}/resolver/', {'moderador': self.ana.id, 'accion': 'descartar'}).status_code, 403)
        r = self.post(f'/api/reportes/{id}/resolver/', {'moderador': self.mod.id, 'accion': 'descartar'})
        self.assertEqual(r.json()['data']['estado'], 'DESCARTADO')
        self.assertTrue(Resena.objects.filter(id=self.resena.id).exists())

    # ---- CU26 ----
    def sancionar(self, tipo, dias=None, usuario=None):
        datos = {'moderador': self.mod.id, 'usuario': (usuario or self.beto).id, 'tipo': tipo, 'motivo': 'Insultos'}
        if dias:
            datos['dias'] = dias
        return self.post('/api/sanciones/', datos)

    def test_suspension_bloquea_publicar(self):
        self.assertEqual(self.sancionar('SUSPENSION').status_code, 400)   # falta "dias"
        r = self.sancionar('SUSPENSION', dias=3)
        self.assertEqual(r.status_code, 201)
        self.assertTrue(r.json()['data']['vigente'])
        # beto ya no puede crear tópicos ni comentar
        r = self.post('/api/topicos/', {'usuario': self.beto.id, 'videojuego_id': self.juego.id,
                                        'titulo': 'Hola a todos', 'texto': 'Un tópico nuevo'})
        self.assertEqual(r.status_code, 403)
        self.assertIn('suspendido', r.json()['data'])
        # ana sí
        BibliotecaItem.objects.create(usuario=self.ana, videojuego=self.juego, estado='JUGANDO', puntaje=8)
        r = self.post('/api/resenas/', {'usuario': self.ana.id, 'videojuego_id': self.juego.id, 'texto': 'Muy bueno el juego'})
        self.assertEqual(r.status_code, 201)

    def test_advertencia_no_bloquea_y_no_se_sanciona_a_un_moderador(self):
        self.assertEqual(self.sancionar('ADVERTENCIA').status_code, 201)
        self.assertEqual(self.post(f'/api/resenas/{self.resena.id}/respuestas/',
                                   {'usuario': self.beto.id, 'texto': 'Respondo'}).status_code, 201)
        self.assertEqual(self.sancionar('ADVERTENCIA', usuario=self.mod).status_code, 400)

    def test_ver_sanciones_solo_uno_mismo_o_moderador(self):
        self.sancionar('ADVERTENCIA')
        self.assertEqual(self.client.get(f'/api/sanciones/?usuario={self.beto.id}&yo={self.ana.id}').status_code, 403)
        self.assertEqual(len(self.client.get(f'/api/sanciones/?usuario={self.beto.id}&yo={self.beto.id}').json()['data']), 1)
        self.assertEqual(Sancion.objects.get().moderador, self.mod)
