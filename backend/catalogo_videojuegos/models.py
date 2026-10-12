from django.db import models

class Genero(models.Model):
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre


class Plataforma(models.Model):
    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre


class Videojuego(models.Model):
    titulo = models.CharField(max_length=200)
    sinopsis = models.TextField(blank=True)
    portada_url = models.URLField(blank=True) # la imagen de la portada se extrae de la API a través de la URL
    fecha_lanzamiento = models.DateField(null=True, blank=True) # puede ser nulo ya que algunos juegos no tienen fecha de lanzamiento
    desarrollador = models.CharField(max_length=100, blank=True)
    distribuidor = models.CharField(max_length=100, blank=True)
    generos = models.ManyToManyField(Genero, blank=True)
    plataformas = models.ManyToManyField(Plataforma, blank=True) # el campo queda blank=True por motivos de testing, revisar si la API lo requiere!!!

    def __str__(self):
        return self.titulo