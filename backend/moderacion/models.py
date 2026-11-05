from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Reporte(models.Model):
    """Un usuario avisa que una reseña, un tópico o un comentario es inapropiado (CU23)."""

    class Tipo(models.TextChoices):
        RESENA = 'RESENA', 'Reseña'
        TOPICO = 'TOPICO', 'Tópico'
        COMENTARIO = 'COMENTARIO', 'Comentario'

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        ELIMINADO = 'ELIMINADO', 'Contenido eliminado'   # CU25: el moderador lo borró
        DESCARTADO = 'DESCARTADO', 'Descartado'          # el moderador decidió que estaba bien

    reportante = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reportes_hechos')
    # Qué se reporta: el tipo + el id. Así un solo modelo sirve para reseñas, tópicos y comentarios
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    contenido_id = models.PositiveIntegerField()
    # Quién escribió el contenido y una copia del texto: si el moderador lo borra,
    # el reporte sigue sabiendo a quién sancionar y qué decía
    autor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reportes_recibidos')
    texto = models.TextField()
    motivo = models.TextField()
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)
    # SET_NULL: si se borra el moderador, el reporte queda (sin moderador)
    moderador = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='reportes_resueltos')
    creado = models.DateTimeField(auto_now_add=True)
    resuelto = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-creado']
        constraints = [
            # El mismo usuario no puede reportar dos veces lo mismo mientras siga pendiente.
            # condition: la regla vale solo para las filas PENDIENTE (después puede volver a reportarlo)
            models.UniqueConstraint(fields=['reportante', 'tipo', 'contenido_id'],
                                    condition=models.Q(estado='PENDIENTE'),
                                    name='un_reporte_pendiente_por_usuario'),
        ]

    def __str__(self):
        return f'{self.get_tipo_display()} {self.contenido_id} reportado por {self.reportante}'


class Sancion(models.Model):
    """Advertencia o suspensión temporal que aplica un moderador (CU26)."""

    class Tipo(models.TextChoices):
        ADVERTENCIA = 'ADVERTENCIA', 'Advertencia'
        SUSPENSION = 'SUSPENSION', 'Suspensión'

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sanciones')
    moderador = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sanciones_aplicadas')
    reporte = models.ForeignKey(Reporte, on_delete=models.SET_NULL, null=True, blank=True, related_name='sanciones')
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    motivo = models.TextField(blank=True)
    inicio = models.DateTimeField(default=timezone.now)
    fin = models.DateTimeField(null=True, blank=True)   # solo las suspensiones tienen fin

    class Meta:
        ordering = ['-inicio']

    def __str__(self):
        return f'{self.get_tipo_display()} a {self.usuario}'

    @property
    def vigente(self):
        """Una suspensión está vigente si ya empezó y todavía no terminó."""
        ahora = timezone.now()
        return self.tipo == self.Tipo.SUSPENSION and self.inicio <= ahora < self.fin


def suspension_vigente(usuario_id):
    """La suspensión que tiene el usuario ahora mismo, o None si no está suspendido."""
    ahora = timezone.now()
    return (Sancion.objects
            .filter(usuario_id=usuario_id, tipo=Sancion.Tipo.SUSPENSION, inicio__lte=ahora, fin__gt=ahora)
            .order_by('-fin').first())
