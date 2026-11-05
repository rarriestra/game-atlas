from django.contrib.auth.models import User
from django.db import models


class Seguimiento(models.Model):
    """Un usuario sigue a otro (CU19 y CU20). Como en una red social: no hace falta que sea mutuo."""
    # Dos ForeignKey a la MISMA tabla (User): por eso los related_name tienen que ser distintos
    seguidor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='siguiendo')
    seguido = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seguidores')
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            # No se puede seguir dos veces a la misma persona
            models.UniqueConstraint(fields=['seguidor', 'seguido'], name='seguir_una_vez'),
            # Nadie puede seguirse a sí mismo (lo controla la base de datos)
            models.CheckConstraint(condition=~models.Q(seguidor=models.F('seguido')), name='no_seguirse_a_si_mismo'),
        ]

    def __str__(self):
        return f'{self.seguidor} sigue a {self.seguido}'
