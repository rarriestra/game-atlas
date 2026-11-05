from django.contrib.auth.models import User
from django.db import models

from catalogo_videojuegos.models import Videojuego


class Topico(models.Model):
    """Un hilo de discusión dentro del foro de un juego (CU13 a CU15)."""
    videojuego = models.ForeignKey(Videojuego, on_delete=models.CASCADE, related_name='topicos')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='topicos')
    titulo = models.CharField(max_length=150)
    texto = models.TextField()
    creado = models.DateTimeField(auto_now_add=True)
    editado = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-creado']

    def __str__(self):
        return self.titulo


class Comentario(models.Model):
    """Un comentario dentro de un tópico. Puede ser respuesta a otro comentario (CU16 a CU18)."""
    topico = models.ForeignKey(Topico, on_delete=models.CASCADE, related_name='comentarios')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comentarios')
    texto = models.TextField()
    # ForeignKey a sí mismo ('self'): un comentario puede apuntar a otro comentario.
    # null = es un comentario principal; con valor = es una respuesta a ese comentario
    respuesta_a = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='respuestas'
    )
    creado = models.DateTimeField(auto_now_add=True)
    editado = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['creado']  # como una conversación: lo más viejo arriba

    def __str__(self):
        return f'Comentario de {self.usuario} en "{self.topico}"'
