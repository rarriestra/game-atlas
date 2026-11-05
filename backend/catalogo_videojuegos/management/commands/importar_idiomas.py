import requests
from django.core.management.base import BaseCommand, CommandError

from catalogo_videojuegos.igdb import buscar_idiomas, guardar_idiomas
from catalogo_videojuegos.models import Videojuego


class Command(BaseCommand):
    help = 'Completa los idiomas de los juegos que ya están en la base y todavía no los tienen'

    def handle(self, *args, **options):
        # Solo los que vinieron de IGDB (tienen igdb_id) y todavía no tienen idiomas
        pendientes = Videojuego.objects.exclude(igdb_id=None).filter(idiomas__isnull=True)
        por_igdb_id = {videojuego.igdb_id: videojuego for videojuego in pendientes}

        try:
            juegos = buscar_idiomas(list(por_igdb_id))
        except (requests.RequestException, RuntimeError) as error:
            raise CommandError(f'No se pudo consultar IGDB: {error}')

        completados = 0
        for juego in juegos:
            videojuego = por_igdb_id.get(juego['id'])
            if videojuego and guardar_idiomas(videojuego, juego):
                completados += 1

        self.stdout.write(self.style.SUCCESS(
            f'Listo: {completados} de {len(por_igdb_id)} juegos con idiomas. '
            f'Los otros {len(por_igdb_id) - completados} no tienen el dato en IGDB.'
        ))
