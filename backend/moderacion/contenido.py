"""Busca el contenido reportado (una reseña, un tópico o un comentario) a partir del tipo y el id."""
from biblioteca.models import Resena
from comunidad.models import Comentario, Topico
from .models import Reporte

# Qué modelo corresponde a cada tipo de reporte
MODELOS = {
    Reporte.Tipo.RESENA: Resena,
    Reporte.Tipo.TOPICO: Topico,
    Reporte.Tipo.COMENTARIO: Comentario,
}


def buscar(tipo, id):
    """El objeto reportado, o None si no existe (o ya fue eliminado)."""
    modelo = MODELOS.get(tipo)
    return modelo.objects.filter(id=id).first() if modelo else None


def copiar_texto(tipo, contenido):
    """El texto que se guarda en el reporte. Del tópico se guarda también el título."""
    if tipo == Reporte.Tipo.TOPICO:
        return f'{contenido.titulo}\n\n{contenido.texto}'
    return contenido.texto


def ubicacion(tipo, contenido):
    """Dónde está el contenido, para que el moderador pueda ir a verlo."""
    if tipo == Reporte.Tipo.RESENA:
        videojuego, topico_id = contenido.videojuego, None
    elif tipo == Reporte.Tipo.TOPICO:
        videojuego, topico_id = contenido.videojuego, contenido.id
    else:
        videojuego, topico_id = contenido.topico.videojuego, contenido.topico_id
    return {'videojuego': {'id': videojuego.id, 'titulo': videojuego.titulo}, 'topico': topico_id}
