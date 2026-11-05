// Los 4 estados posibles: los mismos valores que BibliotecaItem.Estado en Django
export type Estado = 'PENDIENTE' | 'JUGANDO' | 'COMPLETADO' | 'ABANDONADO';

// Para dibujar botones y desplegables: valor que se guarda + texto que se muestra
export const ESTADOS: { valor: Estado; texto: string }[] = [
  { valor: 'PENDIENTE', texto: 'Pendiente' },
  { valor: 'JUGANDO', texto: 'Jugando' },
  { valor: 'COMPLETADO', texto: 'Completado' },
  { valor: 'ABANDONADO', texto: 'Abandonado' },
];

// CU04: solo con estos estados se habilita la calificación
export const ESTADOS_CALIFICABLES: Estado[] = ['JUGANDO', 'COMPLETADO', 'ABANDONADO'];

// El juego viene resumido: solo lo necesario para la tabla
export interface VideojuegoResumen {
  id: number;
  titulo: string;
  portada_url: string;
}

// Un juego dentro de la biblioteca de un usuario (mismos campos que el serializer)
export interface BibliotecaItem {
  id: number;
  usuario: number;
  videojuego: VideojuegoResumen;
  estado: Estado;
  puntaje: number | null;   // null = sin calificar
  puntaje_general: number | null;   // promedio de todos los usuarios; null = nadie lo calificó
  actualizado: string;
}
