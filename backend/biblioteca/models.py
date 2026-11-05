from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from catalogo_videojuegos.models import Videojuego


class BibliotecaItem(models.Model):
    """Un juego dentro de la biblioteca de un usuario, con su estado y su puntaje (CU04 y CU05)."""

    # choices: los únicos valores permitidos. El primero se guarda en la base; el segundo se muestra
    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        JUGANDO = 'JUGANDO', 'Jugando'
        COMPLETADO = 'COMPLETADO', 'Completado'
        ABANDONADO = 'ABANDONADO', 'Abandonado'

    # Según el CU04, solo con estos estados se puede calificar
    ESTADOS_CALIFICABLES = [Estado.JUGANDO, Estado.COMPLETADO, Estado.ABANDONADO]

    # ForeignKey = "muchos a uno": un usuario tiene muchos items; cada item es de un usuario.
    # on_delete=CASCADE: si se borra el usuario o el juego, se borran sus items.
    # related_name: el nombre para ir "al revés" (usuario.biblioteca, videojuego.en_bibliotecas)
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='biblioteca')
    videojuego = models.ForeignKey(Videojuego, on_delete=models.CASCADE, related_name='en_bibliotecas')
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)
    puntaje = models.PositiveSmallIntegerField(
        null=True, blank=True,  # vacío = todavía no calificó
        validators=[MinValueValidator(1), MaxValueValidator(10)],  # del 1 al 10 (CU05)
    )
    actualizado = models.DateTimeField(auto_now=True)  # se completa solo cada vez que se guarda

    class Meta:
        # Un usuario no puede tener el mismo juego dos veces en su biblioteca
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'videojuego'], name='un_juego_por_usuario'),
        ]
        ordering = ['-actualizado']  # lo último que tocaste aparece primero

    def __str__(self):
        return f'{self.usuario} - {self.videojuego} ({self.estado})'


class Resena(models.Model):
    """Opinión escrita de un usuario sobre un juego que ya calificó (CU06 a CU08)."""
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resenas')
    videojuego = models.ForeignKey(Videojuego, on_delete=models.CASCADE, related_name='resenas')
    texto = models.TextField()
    creada = models.DateTimeField(auto_now_add=True)  # se completa sola al crearla, y no cambia más
    editada = models.DateTimeField(auto_now=True)     # se actualiza sola cada vez que se guarda

    class Meta:
        # Una reseña por usuario y juego, como en MyAnimeList
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'videojuego'], name='una_resena_por_juego'),
        ]
        ordering = ['-creada']  # las más nuevas primero

    def __str__(self):
        return f'Reseña de {self.usuario} sobre {self.videojuego}'
