from django.test import TestCase

from .models import Genero, Plataforma, Videojuego
from .serializers import VideojuegoSerializer


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
