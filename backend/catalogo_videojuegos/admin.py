from django.contrib import admin
from .models import Genero, Idioma, Plataforma, Videojuego # del archivo models.py que está al lado de este admin.py, traeme esas cuatro clases

admin.site.register(Genero)
admin.site.register(Plataforma)
admin.site.register(Idioma)
admin.site.register(Videojuego) # admin.site.register(Videojuego) es el aviso al panel: "mostrá esta tabla en /admin"