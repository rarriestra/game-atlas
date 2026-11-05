import os
from datetime import datetime, timezone

import hashlib
from django.core.cache import cache

import requests
from django.db import transaction

from .models import Genero, Plataforma, Videojuego

TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
GAMES_URL = 'https://api.igdb.com/v4/games'
PORTADA_URL = 'https://images.igdb.com/igdb/image/upload/t_cover_big/{}.jpg'


def obtener_token():
    """Pide a Twitch un token de acceso con el Client ID y el Secret del .env."""
    client_id = os.getenv('IGDB_CLIENT_ID')
    client_secret = os.getenv('IGDB_CLIENT_SECRET')
    if not client_id or not client_secret:
        raise RuntimeError('Faltan IGDB_CLIENT_ID o IGDB_CLIENT_SECRET en el archivo .env')
    respuesta = requests.post(TOKEN_URL, params={
        'client_id': client_id,
        'client_secret': client_secret,
        'grant_type': 'client_credentials',
    }, timeout=10)
    respuesta.raise_for_status()  # si Twitch responde con error, corta acá
    return respuesta.json()['access_token']


def buscar_juegos(texto, limite=20):
    """Busca juegos en IGDB por nombre y devuelve la lista tal como la manda IGDB."""
    token = obtener_token()
    texto = texto.replace('"', '')  # unas comillas en el texto romperían la consulta
    # IGDB usa su propio lenguaje de consulta (Apicalypse): campos, búsqueda y límite
    consulta = (
        'fields name, summary, first_release_date, cover.image_id, '
        'genres.name, platforms.name, '
        'involved_companies.company.name, involved_companies.developer, involved_companies.publisher; '
        f'search "{texto}"; '
        f'limit {limite};'
    )
    respuesta = requests.post(GAMES_URL, headers={
        'Client-ID': os.getenv('IGDB_CLIENT_ID'),
        'Authorization': f'Bearer {token}',
    }, data=consulta.encode('utf-8'), timeout=15)
    respuesta.raise_for_status()
    return respuesta.json()


def _fecha(timestamp):
    """IGDB manda la fecha como segundos desde 1970; la pasamos a fecha normal."""
    if not timestamp:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).date()


def _portada(juego):
    """Arma la URL de la portada en tamaño grande a partir del image_id."""
    cover = juego.get('cover') or {}
    if not cover.get('image_id'):
        return ''
    return PORTADA_URL.format(cover['image_id'])


def _empresa(juego, rol):
    """Devuelve la primera empresa que cumple el rol: 'developer' o 'publisher'."""
    for participacion in juego.get('involved_companies', []):
        if participacion.get(rol) and participacion.get('company'):
            return participacion['company'].get('name', '')[:100]
    return ''


def _buscar_o_crear(modelo, nombre):
    """Busca un Genero o Plataforma por nombre (sin importar mayúsculas); si no existe, lo crea."""
    existente = modelo.objects.filter(nombre__iexact=nombre).first()
    return existente or modelo.objects.create(nombre=nombre)


@transaction.atomic  # si algo falla a mitad de camino, no queda un juego guardado a medias
def guardar_juego(juego):
    """Guarda un juego de IGDB en nuestra base. Devuelve (videojuego, creado)."""
    existente = Videojuego.objects.filter(igdb_id=juego['id']).first()
    if existente:
        # Ya estaba: no lo pisamos, así se respetan las correcciones del administrador
        return existente, False

    videojuego = Videojuego.objects.create(
        igdb_id=juego['id'],
        titulo=juego.get('name', '')[:200],
        sinopsis=juego.get('summary', ''),
        portada_url=_portada(juego),
        fecha_lanzamiento=_fecha(juego.get('first_release_date')),
        desarrollador=_empresa(juego, 'developer'),
        distribuidor=_empresa(juego, 'publisher'),
    )
    generos = [_buscar_o_crear(Genero, g['name'][:50]) for g in juego.get('genres', []) if g.get('name')]
    plataformas = [_buscar_o_crear(Plataforma, p['name'][:50]) for p in juego.get('platforms', []) if p.get('name')]
    videojuego.generos.set(generos)
    videojuego.plataformas.set(plataformas)
    return videojuego, True

def importar_si_hace_falta(texto, limite=20):
    """Busca en IGDB y guarda los juegos que todavía no tengamos.
    Recuerda cada búsqueda por un día para no consultar IGDB de nuevo con el mismo texto."""
    texto = texto.strip().lower()
    # md5 convierte el texto en un código sin espacios ni símbolos raros, que es lo que acepta el caché
    clave = 'igdb-busqueda-' + hashlib.md5(texto.encode('utf-8')).hexdigest()
    if cache.get(clave):
        return 0  # ya se buscó hace poco: no molestamos a IGDB
    try:
        juegos = buscar_juegos(texto, limite)
    except (requests.RequestException, RuntimeError):
        return 0  # si IGDB falla o no hay credenciales, seguimos con lo que hay en la base
    nuevos = 0
    for juego in juegos:
        _, creado = guardar_juego(juego)
        if creado:
            nuevos += 1
    cache.set(clave, True, 60 * 60 * 24)  # 24 horas
    return nuevos