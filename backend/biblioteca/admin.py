from django.contrib import admin
from .models import BibliotecaItem, LikeResena, Resena, RespuestaResena

admin.site.register(BibliotecaItem)
admin.site.register(Resena)
admin.site.register(LikeResena)
admin.site.register(RespuestaResena)
