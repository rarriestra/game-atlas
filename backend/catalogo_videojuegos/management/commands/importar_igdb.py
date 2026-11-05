import requests
from django.core.management.base import BaseCommand, CommandError

from catalogo_videojuegos.igdb import buscar_juegos, guardar_juego


class Command(BaseCommand):
    help = 'Busca juegos en IGDB y los guarda en la base de GameAtlas'

    def add_arguments(self, parser):
        # Lo que se escribe después del nombre del comando
        parser.add_argument('busqueda', help='Texto a buscar, por ejemplo "zelda"')
        parser.add_argument('--limite', type=int, default=20, help='Cantidad máxima de juegos (por defecto 20)')

    def handle(self, *args, **options):
        try:
            juegos = buscar_juegos(options['busqueda'], options['limite'])
        except (requests.RequestException, RuntimeError) as error:
            raise CommandError(f'No se pudo consultar IGDB: {error}')

        nuevos = 0
        for juego in juegos:
            videojuego, creado = guardar_juego(juego)
            if creado:
                nuevos += 1
                self.stdout.write(self.style.SUCCESS(f'+ {videojuego.titulo}')) # stdout es la salida estándar, style.SUCCESS es para que se vea en verde
            else:
                self.stdout.write(f'= {videojuego.titulo} (ya estaba)')

        self.stdout.write(self.style.SUCCESS(f'Listo: {nuevos} nuevos de {len(juegos)} encontrados.'))