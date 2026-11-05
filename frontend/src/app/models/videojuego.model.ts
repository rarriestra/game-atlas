import { Genero } from './genero.model'; // Traemos los modelos de Género y Plataforma para usarlos como tipo más abajo
import { Plataforma } from './plataforma.model';
export class Videojuego {
id?: number;  // Opcional (?): un juego nuevo todavía no tiene id; lo asigna Postgres al guardarlo
titulo = '';
sinopsis = '';
portada_url = '';
fecha_lanzamiento: string | null = null;
desarrollador = '';
distribuidor = '';
// Llegan completos ({ id, nombre }) gracias al serializer anidado
generos: Genero[] = [];
plataformas: Plataforma[] = [];
puntaje_promedio: number | null = null;   // NUEVO: promedio de los usuarios (lo calcula Django)
cantidad_puntajes = 0;                     // NUEVO: cuántos lo calificaron
}
export interface ApiResponse<T> { // <T> es un genérico: data puede ser un Videojuego, una lista, un Genero, etc.
status: string;
data: T;
}
// Respuesta paginada: los juegos de la página + datos para el paginador
export interface Pagina<T> {
  data: T[];
  count: number;
  pages: number;
  page: number;
}